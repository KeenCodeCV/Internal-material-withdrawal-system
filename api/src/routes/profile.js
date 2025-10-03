// apps/api/src/routes/profile.js
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/profile/me — โปรไฟล์ของผู้ใช้ที่ล็อกอิน (readonly)
router.get('/me', auth(), async (req, res, next) => {
  try {
    const [[u]] = await pool.query(
      `SELECT id, name, email, role, department, position, is_active AS isActive, created_at AS createdAt
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    if (!u) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    res.json({ data: u });
  } catch (e) { next(e); }
});

module.exports = router;
