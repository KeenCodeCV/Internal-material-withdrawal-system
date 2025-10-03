// apps/web/app/requisitions/new/page.js
'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function NewRequisition(){
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]); // [{item_id, code, name, unit, stock, qty}]
  const typingTimer = useRef(null);
  const router = useRouter();

  const loadItems = async (q='')=>{
    const res = await api(`/items?search=${encodeURIComponent(q)}`);
    setItems(res.data || []);
  };
  useEffect(()=>{ loadItems(); },[]);

  // live search (300ms)
  useEffect(()=>{
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(()=> loadItems(search), 300);
    return ()=> clearTimeout(typingTimer.current);
  }, [search]);

  const addToCart = (it)=>{
    const exist = cart.find(c=>c.item_id===it.id);
    if (exist) return;
    setCart([...cart, {
      item_id: it.id,
      code: it.code,
      name: it.name,
      unit: it.unit,
      stock: it.stock ?? 0,
      qty: 1
    }]);
  };

  const changeQty = (item_id, qty)=>{
    const n = Math.max(0, Number(qty)||0);
    setCart(prev => prev.map(c=> c.item_id===item_id ? { ...c, qty: n } : c));
  };

  const saveDraftAndMaybeSubmit = async ()=>{
    // validations
    const zero = cart.filter(c => !c.qty);
    if (zero.length) {
      return Swal.fire({ icon:'warning', title:'กรุณาใส่จำนวนมากกว่า 0' });
    }
    const over = cart.filter(c => c.qty > c.stock);
    if (over.length) {
      const msg = over.map(c=> `${c.code} (คงเหลือ ${c.stock})`).join(', ');
      return Swal.fire({ icon:'error', title:'จำนวนเกินคงเหลือ', text: msg });
    }

    // create DRAFT
    const payload = { items: cart.map(c=>({ item_id: c.item_id, qty_request: Number(c.qty) })) };
    try{
      const res = await api('/requisitions', { method:'POST', body: payload }); // { id, request_no, message }
      const draftId = res?.id;

      const ask = await Swal.fire({
        icon: 'success',
        title: 'บันทึกฉบับร่างแล้ว',
        text: 'ต้องการส่งอนุมัติเลยไหม?',
        showCancelButton: true,
        confirmButtonText: 'ส่งอนุมัติ',
        cancelButtonText: 'ยังไม่ส่ง'
      });

      if (ask.isConfirmed && draftId){
        try{
          await api(`/requisitions/${draftId}/submit`, { method:'PATCH' });
          await Swal.fire({ icon:'success', title:'ส่งอนุมัติแล้ว', timer:900, showConfirmButton:false });
          router.push('/requisitions/my'); // ไปหน้าคำขอของฉัน
        }catch(e){
          Swal.fire({ icon:'error', title:'ส่งอนุมัติไม่สำเร็จ', text:e.message });
        }
      } else {
        Swal.fire({ icon:'info', title:'เก็บเป็นฉบับร่างแล้ว', timer:900, showConfirmButton:false });
        router.push('/requisitions/my'); // เก็บร่างเสร็จ ก็ไปหน้าคำขอของฉันเช่นกัน
      }
    }catch(e){
      Swal.fire({ icon:'error', title:'สร้างไม่สำเร็จ', text:e.message });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">สร้างคำขอเบิก (DRAFT)</h3>

      {/* เลือกวัสดุ */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="ค้นหาวัสดุ"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <button className="btn" onClick={()=>loadItems(search)}>ค้นหา</button>
        </div>

        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">รหัส</th>
                <th className="th">ชื่อ</th>
                <th className="th">หน่วย</th>
                <th className="th">คงเหลือ</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items.map(it=>(
                  <motion.tr key={it.id}
                    initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.2}}>
                    <td className="td">{it.code}</td>
                    <td className="td">{it.name}</td>
                    <td className="td">{it.unit}</td>
                    <td className="td">
                      <span className="inline-block min-w-[44px] text-center rounded-2xl px-3 py-1 bg-violet-500/30">
                        {it.stock ?? 0}
                      </span>
                    </td>
                    <td className="td">
                      <button className="btn" onClick={()=>addToCart(it)}>เพิ่ม</button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!items.length && <tr><td className="td" colSpan={5}>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ตะกร้าคำขอ */}
      <div className="card p-4 space-y-3">
        <h4 className="font-medium">รายการที่จะขอ</h4>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">รหัส</th>
                <th className="th">ชื่อ</th>
                <th className="th">คงเหลือ</th>
                <th className="th">จำนวนที่ขอ</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(c=>(
                <tr key={c.item_id}>
                  <td className="td">{c.code}</td>
                  <td className="td">{c.name}</td>
                  <td className="td">{c.stock}</td>
                  <td className="td">
                    <input
                      type="number"
                      className="input w-28"
                      value={c.qty}
                      min={0}
                      max={c.stock}
                      onChange={e=>changeQty(c.item_id, e.target.value)}
                    />
                  </td>
                  <td className="td">
                    <button className="btn" onClick={()=>setCart(cart.filter(x=>x.item_id!==c.item_id))}>ลบ</button>
                  </td>
                </tr>
              ))}
              {!cart.length && <tr><td className="td" colSpan={5}>ยังไม่มีรายการ</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button className="btn" disabled={!cart.length} onClick={saveDraftAndMaybeSubmit}>
            บันทึกเป็น DRAFT / ส่งอนุมัติ
          </button>
        </div>
      </div>
    </div>
  );
}
