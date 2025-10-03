// apps/web/app/items/page.js
'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../components/AuthProvider';

export default function Page(){
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm]   = useState({ code:'', name:'', category:'สำนักงาน', unit:'ชิ้น', stock:0 });

  const { user }   = useAuth();
  const isManager  = !!(user && (user.role === 'admin' || user.role === 'storekeeper'));
  const typingRef  = useRef(null);

  const load = async (q = search)=>{
    const res = await api(`/items?search=${encodeURIComponent(q)}`);
    setList(res.data || []);
  };

  useEffect(()=>{ load(''); },[]);

  // live search (300ms)
  useEffect(()=>{
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(()=> load(search), 300);
    return ()=> clearTimeout(typingRef.current);
  }, [search]);

  const createItem = async (e)=>{
    e.preventDefault();
    try{
      await api('/items', { method:'POST', body: form });
      setForm({ code:'', name:'', category:'สำนักงาน', unit:'ชิ้น', stock:0 });
      await load();
      Swal.fire({ icon:'success', title:'บันทึกสำเร็จ', timer:1000, showConfirmButton:false });
    }catch(e){
      Swal.fire({ icon:'error', title:'ผิดพลาด', text:e.message });
    }
  };

  const del = async (id)=>{
    const c = await Swal.fire({ icon:'warning', title:'ยืนยันการลบ?', showCancelButton:true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก' });
    if(!c.isConfirmed) return;
    await api(`/items/${id}`,{ method:'DELETE' });
    await load();
    Swal.fire({ icon:'success', title:'ลบแล้ว', timer:800, showConfirmButton:false });
  };

  const editItem = async (item)=>{
    const { value: payload } = await Swal.fire({
      title: 'แก้ไขวัสดุ',
      html:
        `<input id="code" class="swal2-input" placeholder="รหัส" value="${item.code ?? ''}">` +
        `<input id="name" class="swal2-input" placeholder="ชื่อ" value="${item.name ?? ''}">` +
        `<input id="category" class="swal2-input" placeholder="หมวด" value="${item.category ?? ''}">` +
        `<input id="unit" class="swal2-input" placeholder="หน่วย" value="${item.unit ?? ''}">` +
        `<input id="stock" type="number" class="swal2-input" placeholder="คงเหลือ" value="${item.stock ?? 0}">`,
      showCancelButton:true,
      confirmButtonText:'บันทึก',
      focusConfirm:false,
      preConfirm:()=>{
        const data = {
          code: document.getElementById('code').value,
          name: document.getElementById('name').value,
          category: document.getElementById('category').value,
          unit: document.getElementById('unit').value,
          stock: Number(document.getElementById('stock').value)
        };
        Object.keys(data).forEach(k=>{ if(data[k] === '' || Number.isNaN(data[k])) delete data[k]; });
        return data;
      }
    });
    if(!payload) return;
    await api(`/items/${item.id}`, { method:'PATCH', body: payload });
    await load();
    Swal.fire({ icon:'success', title:'แก้ไขสำเร็จ', timer:900, showConfirmButton:false });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">วัสดุ</h3>

      <div className="flex gap-2">
        <input
          className="input"
          placeholder="ค้นหา"
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
        <button className="btn" onClick={()=>load()}>ค้นหา</button>
      </div>

      <div className="overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="th">รหัส</th>
              <th className="th">ชื่อ</th>
              <th className="th">หมวด</th>
              <th className="th">หน่วย</th>
              <th className="th">คงเหลือ</th>
              {isManager && <th className="th">ดำเนินการ</th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {list.map(it=>(
                <motion.tr key={it.id}
                  initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.2}}
                >
                  <td className="td">{it.code}</td>
                  <td className="td">{it.name}</td>
                  <td className="td">{it.category || '-'}</td>
                  <td className="td">{it.unit}</td>
                  <td className="td">
                    <span className="inline-block min-w-[44px] text-center rounded-2xl px-3 py-1 bg-violet-500/30">
                      {Number(it.stock ?? 0)}
                    </span>
                  </td>

                  {isManager && (
                    <td className="td flex gap-2">
                      <button className="btn" onClick={()=>editItem(it)}>แก้ไข</button>
                      <button className="btn" onClick={()=>del(it.id)}>ลบ</button>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>

            {!list.length && (
              <tr>
                <td className="td" colSpan={isManager ? 6 : 5}>ไม่มีข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="border-white/10"/>

      {isManager ? (
        <>
          <h4 className="font-medium">เพิ่มวัสดุ</h4>
          <form onSubmit={createItem} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block mb-1">รหัส</label><input className="input" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} required/></div>
            <div><label className="block mb-1">ชื่อ</label><input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/></div>
            <div><label className="block mb-1">หมวด</label><input className="input" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} required/></div>
            <div><label className="block mb-1">หน่วย</label><input className="input" value={form.unit} onChange={e=>setForm({...form, unit:e.target.value})} required/></div>
            <div><label className="block mb-1">คงเหลือเริ่มต้น</label><input type="number" className="input" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})}/></div>
            <div className="flex items-end"><button className="btn">บันทึก</button></div>
          </form>
        </>
      ) : (
        <div className="text-white/70">* ผู้ใช้งานทั่วไปไม่สามารถเพิ่ม/ลบ/แก้คงเหลือได้</div>
      )}
    </div>
  );
}
