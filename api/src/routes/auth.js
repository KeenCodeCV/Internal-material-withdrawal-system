const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { sign } = require('../utils/jwt');
const auth = require('../middleware/auth');

router.post('/register', async (req,res,next)=>{
  try{
    const { name, email, password, department } = req.body;
    if(!name || !email || !password) return res.status(400).json({ message:'กรอกข้อมูลไม่ครบ' });
    const [r] = await pool.query('SELECT id FROM users WHERE email=?',[email]);
    if(r.length) return res.status(400).json({ message:'อีเมลนี้ถูกใช้แล้ว' });
    const hash = await bcrypt.hash(password,10);
    await pool.query('INSERT INTO users (name,email,password_hash,role,department) VALUES (?,?,?,?,?)',[name,email,hash,'employee',department||null]);
    res.json({ message:'สมัครสำเร็จ' });
  }catch(e){ next(e); }
});

router.post('/login', async (req,res,next)=>{
  try{
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email=? AND is_active=1',[email]);
    if(!rows.length) return res.status(401).json({ message:'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok) return res.status(401).json({ message:'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    const token = sign({ id:user.id, role:user.role, email:user.email, name:user.name });
    res.cookie('token', token, { httpOnly:true, sameSite:'lax' });
    res.json({ message:'เข้าสู่ระบบสำเร็จ', token });
  }catch(e){ next(e); }
});

router.get('/me', auth(), (req,res)=> res.json({ user:req.user }));
router.post('/logout', (req,res)=>{ res.clearCookie('token'); res.json({ message:'ออกจากระบบแล้ว' }); });

module.exports = router;