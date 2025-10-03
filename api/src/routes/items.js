// apps/api/src/routes/items.js
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const toIntOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

// GET /items?search=&category=&page=&size=&sort=
router.get('/', auth(), async (req, res, next) => {
  try {
    const { search = '', page = 1, size = 10, sort = 'created_at desc', category = '' } = req.query;
    const off = (parseInt(page) - 1) * parseInt(size);
    const params = [];
    let whereSql = 'WHERE 1=1';

    if (search) {
      whereSql += ' AND (code LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      whereSql += ' AND category=?';
      params.push(category);
    }

    const [rows] = await pool.query(
      `SELECT * FROM items ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?`,
      [...params, parseInt(size), off]
    );
    const [cnt] = await pool.query(`SELECT COUNT(*) as c FROM items ${whereSql}`, params);

    res.json({ data: rows, total: cnt[0].c });
  } catch (e) { next(e); }
});

// POST /items   (admin/storekeeper)
router.post('/', auth(), roleGuard(['admin','storekeeper']), async (req, res, next) => {
  try {
    const { code, name, category, unit, stock = 0 } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'กรุณากรอก รหัส และ ชื่อวัสดุ' });

    await pool.query(
      'INSERT INTO items (code,name,category,unit,stock) VALUES (?,?,?,?,?)',
      [code, name, category, unit, toIntOrNull(stock) ?? 0]
    );
    res.json({ message: 'เพิ่มวัสดุสำเร็จ' });
  } catch (e) { next(e); }
});

// PATCH /items/:id   (admin/storekeeper) → partial update
router.patch('/:id', auth(), roleGuard(['admin','storekeeper']), async (req, res, next) => {
  try {
    const { code, name, category, unit, stock } = req.body;

    const fields = [];
    const vals = [];

    if (code !== undefined)      { fields.push('code=?');      vals.push(code); }
    if (name !== undefined)      { fields.push('name=?');      vals.push(name); }
    if (category !== undefined)  { fields.push('category=?');  vals.push(category); }
    if (unit !== undefined)      { fields.push('unit=?');      vals.push(unit); }
    if (stock !== undefined)     { fields.push('stock=?');     vals.push(toIntOrNull(stock) ?? 0); }

    if (!fields.length) return res.status(400).json({ message: 'ไม่มีข้อมูลที่จะแก้ไข' });

    vals.push(req.params.id);
    await pool.query(`UPDATE items SET ${fields.join(', ')} WHERE id=?`, vals);

    res.json({ message: 'อัปเดตสำเร็จ' });
  } catch (e) { next(e); }
});

// DELETE /items/:id  (admin/storekeeper)
router.delete('/:id', auth(), roleGuard(['admin','storekeeper']), async (req, res, next) => {
  try {
    const [chk] = await pool.query('SELECT id FROM items WHERE id=?', [req.params.id]);
    if (!chk.length) return res.status(404).json({ message: 'ไม่พบวัสดุ' });

    await pool.query('DELETE FROM items WHERE id=?', [req.params.id]);
    res.json({ message: 'ลบวัสดุสำเร็จ' });
  } catch (e) { next(e); }
});

module.exports = router;
