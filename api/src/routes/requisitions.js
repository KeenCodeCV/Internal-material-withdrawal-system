// apps/api/src/routes/requisitions.js
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

function pad(n, l = 6) { return String(n).padStart(l, '0'); }

/**
 * GET /requisitions?mine=1&status=&summary=1
 */
router.get('/', auth(), async (req, res, next) => {
  try {
    const { mine = '0', status = '', summary = '0' } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (mine === '1') { where += ' AND r.requester_id = ?'; params.push(req.user.id); }
    if (status)      { where += ' AND r.status = ?'; params.push(status); }

    if (summary === '1') {
      const [rows] = await pool.query(
        `SELECT
           r.*,
           u.name       AS requester_name,
           u.department AS requester_department,
           u.position   AS requester_position,
           IFNULL(SUM(ri.qty_request), 0) AS total_qty,
           GROUP_CONCAT(i.name ORDER BY ri.id SEPARATOR ', ') AS items_summary
         FROM requisitions r
         JOIN users u ON u.id = r.requester_id
         LEFT JOIN requisition_items ri ON ri.requisition_id = r.id
         LEFT JOIN items i ON i.id = ri.item_id
         ${where}
         GROUP BY r.id
         ORDER BY r.id DESC`,
        params
      );
      return res.json({ data: rows });
    }

    const [rows] = await pool.query(
      `SELECT
         r.*,
         u.name       AS requester_name,
         u.department AS requester_department,
         u.position   AS requester_position
       FROM requisitions r
       JOIN users u ON u.id = r.requester_id
       ${where}
       ORDER BY r.id DESC`,
      params
    );
    res.json({ data: rows });
  } catch (e) { next(e); }
});

/**
 * GET /requisitions/:id
 */
router.get('/:id', auth(), async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[reqHead]] = await pool.query(
      `SELECT
         r.*,
         u.name       AS requester_name,
         u.department AS requester_department,
         u.position   AS requester_position
       FROM requisitions r
       JOIN users u ON u.id = r.requester_id
       WHERE r.id = ?`,
      [id]
    );
    if (!reqHead) return res.status(404).json({ message: 'ไม่พบคำขอ' });

    const [items] = await pool.query(
      `SELECT
         ri.id, ri.item_id,
         i.code, i.name, i.unit, i.stock,
         ri.qty_request, ri.qty_approved, ri.qty_issued
       FROM requisition_items ri
       JOIN items i ON i.id = ri.item_id
       WHERE ri.requisition_id = ?
       ORDER BY ri.id`,
      [id]
    );

    res.json({ data: { ...reqHead, items } });
  } catch (e) { next(e); }
});

/**
 * POST /requisitions (สร้าง DRAFT)
 */
router.post('/', auth(), async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query(
        'INSERT INTO requisitions (requester_id, status, request_no) VALUES (?,?,?)',
        [req.user.id, 'DRAFT', 'TMP']
      );
      const reqId = ins.insertId;
      const requestNo = 'REQ-' + pad(reqId);
      await conn.query('UPDATE requisitions SET request_no=? WHERE id=?', [requestNo, reqId]);

      for (const it of items) {
        await conn.query(
          'INSERT INTO requisition_items (requisition_id, item_id, qty_request) VALUES (?,?,?)',
          [reqId, it.item_id, it.qty_request]
        );
      }
      await conn.commit();
      res.json({ message: 'สร้างคำขอสำเร็จ', id: reqId, request_no: requestNo });
    } catch (err) {
      await conn.rollback(); throw err;
    } finally { conn.release(); }
  } catch (e) { next(e); }
});

/**
 * PATCH /requisitions/:id/submit
 */
router.patch('/:id/submit', auth(), async (req, res, next) => {
  try {
    const [r] = await pool.query(
      'UPDATE requisitions SET status="SUBMITTED", submitted_at=NOW() WHERE id=? AND requester_id=?',
      [req.params.id, req.user.id]
    );
    if (r.affectedRows === 0) return res.status(403).json({ message: 'Forbidden' });
    res.json({ message: 'ส่งคำขอแล้ว' });
  } catch (e) { next(e); }
});

/**
 * PATCH /requisitions/:id/approve
 */
router.patch('/:id/approve', auth(), roleGuard(['admin', 'approver']), async (req, res, next) => {
  try {
    const reqId = req.params.id;
    const [items] = await pool.query(
      `SELECT ri.item_id, ri.qty_request, i.code, i.name, i.stock
       FROM requisition_items ri
       JOIN items i ON i.id = ri.item_id
       WHERE ri.requisition_id = ?`,
      [reqId]
    );
    if (!items.length) return res.status(400).json({ message: 'ไม่มีรายการในคำขอ' });

    const insufficient = items.filter(it => Number(it.stock) < Number(it.qty_request));
    if (insufficient.length) {
      const msg = insufficient.map(it => `${it.code}(${it.name}) คงเหลือ ${it.stock} < ${it.qty_request}`).join(', ');
      return res.status(400).json({ message: `สต็อกไม่พอ: ${msg}` });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const it of items) {
        await conn.query('UPDATE items SET stock = stock - ? WHERE id = ?', [it.qty_request, it.item_id]);
      }
      await conn.query(
        'UPDATE requisitions SET status="APPROVED", approve_by=?, approve_at=NOW(), reject_reason=NULL WHERE id=?',
        [req.user.id, reqId]
      );
      await conn.commit();
      res.json({ message: 'อนุมัติแล้ว และตัดสต็อกเรียบร้อย' });
    } catch (err) {
      await conn.rollback(); throw err;
    } finally { conn.release(); }
  } catch (e) { next(e); }
});

/**
 * PATCH /requisitions/:id/reject
 */
router.patch('/:id/reject', auth(), roleGuard(['admin', 'approver']), async (req, res, next) => {
  try {
    const { reason = '' } = req.body || {};
    await pool.query(
      'UPDATE requisitions SET status="REJECTED", approve_by=?, approve_at=NOW(), reject_reason=? WHERE id=?',
      [req.user.id, reason, req.params.id]
    );
    res.json({ message: 'ปฏิเสธแล้ว' });
  } catch (e) { next(e); }
});

/**
 * DELETE /requisitions/:id
 */
router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[rec]] = await pool.query(
      'SELECT id, requester_id, status FROM requisitions WHERE id = ?',
      [id]
    );
    if (!rec) return res.status(404).json({ message: 'ไม่พบคำขอ' });

    const isOwner = rec.requester_id === req.user.id;
    const isAdminLike = ['admin', 'approver'].includes(req.user.role);

    let canDelete = false;
    if (isOwner && rec.status === 'DRAFT') canDelete = true;
    if (isAdminLike && (rec.status === 'SUBMITTED' || rec.status === 'REJECTED')) canDelete = true;

    if (!canDelete) return res.status(403).json({ message: 'ไม่อนุญาตให้ลบ' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM requisition_items WHERE requisition_id = ?', [id]);
      await conn.query('DELETE FROM requisitions WHERE id = ?', [id]);
      await conn.commit();
      res.json({ message: 'ลบคำขอแล้ว' });
    } catch (err) {
      await conn.rollback(); throw err;
    } finally { conn.release(); }
  } catch (e) { next(e); }
});

module.exports = router;
