'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { api } from '../../../lib/api';
import { statusTH } from '../../../lib/status';

// ฟังก์ชันฟอร์แมตวันเวลาไทย
function thDT(dt){
  if (!dt) return '';
  const d = new Date(dt);
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(d);
}

export default function MyReqs(){
  const [list, setList] = useState([]);

  // โหลดแบบ summary เพื่อให้ได้ items_summary / total_qty และดึงฟิลด์เวลาจาก r.*
  const load = async ()=>{
    const r = await api('/requisitions?mine=1&summary=1');
    setList(r.data || []);
  };
  useEffect(()=>{ load(); },[]);

  const submitReq = async (id)=>{
    const c = await Swal.fire({ icon:'question', title:'ยืนยันส่งคำขอ?', showCancelButton:true, confirmButtonText:'ส่ง' });
    if(!c.isConfirmed) return;
    await api(`/requisitions/${id}/submit`,{method:'PATCH'});
    await load();
    Swal.fire({ icon:'success', title:'ส่งคำขอแล้ว (กำลังดำเนินการ)', timer:900, showConfirmButton:false });
  };

  const delReq = async (id)=>{
    const c = await Swal.fire({ icon:'warning', title:'ลบคำขอฉบับร่าง?', text:'การลบจะไม่สามารถย้อนกลับได้', showCancelButton:true, confirmButtonText:'ลบ' });
    if(!c.isConfirmed) return;
    await api(`/requisitions/${id}`,{ method:'DELETE' });
    await load();
    Swal.fire({ icon:'success', title:'ลบแล้ว', timer:900, showConfirmButton:false });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">คำขอของฉัน</h3>
      <div className="overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="th">เลขที่</th>
              <th className="th">ชื่อ</th>
              <th className="th">แผนก</th>
              <th className="th">ตำแหน่ง</th>
              <th className="th">วัสดุ</th>
              <th className="th">จำนวน</th>
              <th className="th">สถานะ</th>
              <th className="th">วันที่สร้าง</th>
              <th className="th">วันที่ดำเนินการ</th>
              <th className="th">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r=>{
              const isDraft = r.status === 'DRAFT';
              const actionAt = (r.status==='APPROVED' || r.status==='REJECTED') ? r.approve_at : '';
              return (
                <tr key={r.id}>
                  <td className="td">{r.request_no}</td>
                  <td className="td">{r.requester_name || '-'}</td>
                  <td className="td">{r.requester_department || '-'}</td>
                  <td className="td">{r.requester_position || '-'}</td>
                  <td className="td">{r.items_summary || '-'}</td>
                  <td className="td">{Number(r.total_qty || 0)}</td>
                  <td className="td">{statusTH(r.status)}</td>
                  <td className="td">{thDT(r.created_at)}</td>
                  <td className="td">{thDT(actionAt)}</td>
                  <td className="td">
                    {isDraft ? (
                      <div className="flex gap-2">
                        <button className="btn" onClick={()=>submitReq(r.id)}>ส่งคำขอ</button>
                        <button className="btn" onClick={()=>delReq(r.id)}>ลบ</button>
                      </div>
                    ) : (
                      // ไม่แสดงขีด — เว้นว่างไว้เฉยๆ
                      <span className="inline-block w-0" />
                    )}
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td className="td" colSpan={10}>ยังไม่มีคำขอ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
