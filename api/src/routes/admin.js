// apps/api/src/routes/admin.js
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// ping (ทดสอบ route)
router.get('/ping', (req, res) => {
  res.json({ ok: true, route: 'admin', tip: 'metrics is protected with auth' });
});

// เมตริกแดชบอร์ดแอดมิน
router.get(
  '/metrics',
  auth(),
  roleGuard(['admin', 'approver', 'storekeeper']),
  async (req, res, next) => {
    try {
      const [[users]]         = await pool.query(`SELECT COUNT(*) c FROM users`);
      const [[items]]         = await pool.query(`SELECT COUNT(*) c, IFNULL(SUM(stock),0) total_stock FROM items`);
      const [[outOfStock]]    = await pool.query(`SELECT COUNT(*) c FROM items WHERE stock <= 0`);
      const [[pending]]       = await pool.query(`SELECT COUNT(*) c FROM requisitions WHERE status='SUBMITTED'`);
      const [[drafts]]        = await pool.query(`SELECT COUNT(*) c FROM requisitions WHERE status='DRAFT'`);
      const [[approvedToday]] = await pool.query(`SELECT COUNT(*) c FROM requisitions WHERE status='APPROVED' AND DATE(approve_at)=CURDATE()`);
      const [[rejectedToday]] = await pool.query(`SELECT COUNT(*) c FROM requisitions WHERE status='REJECTED' AND DATE(approve_at)=CURDATE()`);

      const [trend] = await pool.query(`
        SELECT DATE(approve_at) d, IFNULL(SUM(ri.qty_request),0) qty
        FROM requisitions r
        JOIN requisition_items ri ON ri.requisition_id=r.id
        WHERE r.status='APPROVED' AND r.approve_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(approve_at)
        ORDER BY DATE(approve_at)
      `);

      const [top10] = await pool.query(`
        SELECT i.code, i.name, i.unit, SUM(ri.qty_request) qty
        FROM requisition_items ri
        JOIN requisitions r ON r.id=ri.requisition_id
        JOIN items i ON i.id=ri.item_id
        WHERE r.status='APPROVED' AND r.approve_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY ri.item_id
        ORDER BY qty DESC
        LIMIT 10
      `);

      // ✅ เพิ่ม department/position + ใช้ชื่อวัสดุล้วนใน items_summary
      const [waiting] = await pool.query(`
        SELECT
          r.id, r.request_no,
          u.name       AS requester_name,
          u.department AS requester_department,
          u.position   AS requester_position,
          IFNULL(SUM(ri.qty_request),0) AS total_qty,
          GROUP_CONCAT(i.name ORDER BY ri.id SEPARATOR ', ') AS items_summary
        FROM requisitions r
        JOIN users u ON u.id=r.requester_id
        LEFT JOIN requisition_items ri ON ri.requisition_id=r.id
        LEFT JOIN items i ON i.id=ri.item_id
        WHERE r.status='SUBMITTED'
        GROUP BY r.id
        ORDER BY r.id DESC
        LIMIT 10
      `);

      res.json({
        data:{
          kpi:{
            total_users:users.c,
            total_items:items.c,
            total_stock:items.total_stock,
            out_of_stock:outOfStock.c,
            drafts:drafts.c,
            pending:pending.c,
            approved_today:approvedToday.c,
            rejected_today:rejectedToday.c
          },
          trend30d:trend,
          top10,
          waiting
        }
      });
    } catch (e) { next(e); }
  }
);

module.exports = router;
