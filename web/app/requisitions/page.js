'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

export default function Page(){
  const [items,setItems] = useState([]);
  const [rows,setRows] = useState([{item_id:'', qty_request:1}]);
  const [list,setList] = useState([]);

  const load = async ()=>{
    const it = await api('/items');
    setItems(it.data);
    const reqs = await api('/requisitions');
    setList(reqs.data);
  };
  useEffect(()=>{ load(); },[]);

  const addRow = ()=> setRows([...rows,{item_id:'', qty_request:1}]);
  const createReq = async (e)=>{
    e.preventDefault();
    const payload = { items: rows.filter(r=>r.item_id && r.qty_request>0).map(r=>({item_id: Number(r.item_id), qty_request: Number(r.qty_request)})) };
    if(!payload.items.length){ Swal.fire({icon:'info', title:'กรอกอย่างน้อย 1 แถว'}); return; }
    await api('/requisitions',{method:'POST', body: payload});
    setRows([{item_id:'', qty_request:1}]);
    await load();
    Swal.fire({ icon:'success', title:'บันทึก DRAFT แล้ว', timer:1000, showConfirmButton:false });
  };
  const submitReq = async (id)=>{
    const c = await Swal.fire({ icon:'question', title:'ส่งคำขอ?', showCancelButton:true, confirmButtonText:'ส่ง' });
    if(!c.isConfirmed) return;
    await api(`/requisitions/${id}/submit`,{method:'PATCH'});
    await load();
    Swal.fire({ icon:'success', title:'ส่งคำขอแล้ว', timer:900, showConfirmButton:false });
  };

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3}} className="space-y-4">
      <h3 className="text-lg font-semibold">คำขอเบิก</h3>
      <h4 className="font-medium">สร้างคำขอ (DRAFT)</h4>
      <form onSubmit={createReq} className="space-y-2">
        {rows.map((r,idx)=>(
          <div key={idx} className="grid grid-cols-2 gap-2">
            <select className="input" value={r.item_id} onChange={e=>{ const v=[...rows]; v[idx].item_id=e.target.value; setRows(v); }}>
              <option value="">-- เลือกวัสดุ --</option>
              {items.map(it=><option key={it.id} value={it.id}>{it.code} - {it.name}</option>)}
            </select>
            <input className="input" type="number" min="1" value={r.qty_request} onChange={e=>{ const v=[...rows]; v[idx].qty_request=e.target.value; setRows(v); }} />
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={addRow}>+ เพิ่มแถว</button>
          <button className="btn">บันทึก DRAFT</button>
        </div>
      </form>

      <hr className="border-white/10"/>
      <h4 className="font-medium">รายการคำขอ</h4>
      <div className="overflow-auto">
        <table className="table">
          <thead><tr><th className="th">เลขที่</th><th className="th">ผู้ขอ</th><th className="th">สถานะ</th><th className="th"></th></tr></thead>
          <tbody>
            {list.map(r=>(
              <tr key={r.id}>
                <td className="td">{r.request_no}</td>
                <td className="td">{r.requester_name}</td>
                <td className="td">{r.status}</td>
                <td className="td">{r.status==='DRAFT' && <button className="btn" onClick={()=>submitReq(r.id)}>ส่งคำขอ</button>}</td>
              </tr>
            ))}
            {!list.length && <tr><td className="td" colSpan={4}>ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}