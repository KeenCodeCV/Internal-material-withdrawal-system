'use client';
import { useState } from 'react';
import { api } from '../../lib/api';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

export default function Page(){
  const [email,setEmail] = useState('admin@demo.local');
  const [password,setPassword] = useState('123456');
  const onSubmit = async (e)=>{
    e.preventDefault();
    try{
      await api('/auth/login',{method:'POST', body:{email,password}});
      await Swal.fire({ icon:'success', title:'เข้าสู่ระบบสำเร็จ', timer:1000, showConfirmButton:false });
      location.href = '/';
    }catch(e){
      Swal.fire({ icon:'error', title:'ล้มเหลว', text: e.message });
    }
  };
  return (
    <motion.form initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3}} onSubmit={onSubmit} className="space-y-3">
      <h3 className="text-lg font-semibold">เข้าสู่ระบบ</h3>
      <div>
        <label className="block mb-1">อีเมล</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block mb-1">รหัสผ่าน</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <button className="btn">เข้าสู่ระบบ</button>
    </motion.form>
  );
}