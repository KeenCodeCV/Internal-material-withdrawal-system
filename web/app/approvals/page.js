'use client';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { api } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';

// ฟอร์แมตวันเวลาไทย
function thDateTime(dt){
  if (!dt) return '-';
  const d = new Date(dt);
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(d);
}

// สถานะไทย
function statusTH(s){
  switch (s) {
    case 'DRAFT': return 'ฉบับร่าง';
    case 'SUBMITTED': return 'กำลังดำเนินการ';
    case 'APPROVED': return 'อนุมัติแล้ว';
    case 'REJECTED': return 'ปฏิเสธแล้ว';
    default: return s || '-';
  }
}

export default function Approvals(){
  const { user } = useAuth();
  const canView = !!(user && (user.role === 'admin' || user.role === 'approver'));
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // โหลดเฉพาะคำขอที่สถานะ SUBMITTED
  const load = async ()=>{
    setLoading(true);
    try{
      // ใช้ summary=1 จะได้ชื่อวัสดุสั้นๆ + รวมจำนวน และข้อมูลผู้ขอ (แผนก/ตำแหน่ง)
      const res = await api('/requisitions?mine=0&status=SUBMITTED&summary=1');
      setList(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ if (canView) load(); }, [canView]);

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">ไม่อนุญาต</h3>
        <p className="text-white/70">หน้านี้เฉพาะผู้มีสิทธิ์อนุมัติ</p>
      </div>
    );
  }

  const approve = async (id)=>{
    const ok = await Swal.fire({ icon:'question', title:'อนุมัติคำขอ?', showCancelButton:true, confirmButtonText:'อนุมัติ' });
    if (!ok.isConfirmed) return;
    try{
      await api(`/requisitions/${id}/approve`, { method:'PATCH' });
      Swal.fire({ icon:'success', title:'อนุมัติแล้ว', timer:900, showConfirmButton:false });
      load();
    }catch(e){
      Swal.fire({ icon:'error', title:'ล้มเหลว', text:e.message });
    }
  };

  const reject = async (id)=>{
    const { value: reason } = await Swal.fire({ title:'เหตุผลการปฏิเสธ', input:'text', showCancelButton:true });
    if (reason === undefined) return;
    try{
      await api(`/requisitions/${id}/reject`, { method:'PATCH', body:{ reason } });
      Swal.fire({ icon:'success', title:'ปฏิเสธแล้ว', timer:900, showConfirmButton:false });
      load();
    }catch(e){
      Swal.fire({ icon:'error', title:'ล้มเหลว', text:e.message });
    }
  };

  const removeReq = async (id)=>{
    const ok = await Swal.fire({
      icon:'warning',
      title:'ลบคำขอ?',
      text:'ลบแล้วไม่สามารถกู้คืนได้',
      showCancelButton:true,
      confirmButtonText:'ลบ'
    });
    if (!ok.isConfirmed) return;
    try{
      await api(`/requisitions/${id}`, { method:'DELETE' });
      Swal.fire({ icon:'success', title:'ลบแล้ว', timer:900, showConfirmButton:false });
      load();
    }catch(e){
      Swal.fire({ icon:'error', title:'ล้มเหลว', text:e.message });
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">อนุมัติคำขอ</h3>

      <div className="overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="th">เลขที่</th>
              <th className="th">ผู้ขอ</th>
              <th className="th">แผนก</th>
              <th className="th">ตำแหน่ง</th>
              <th className="th">วัสดุ</th>
              <th className="th">จำนวน</th>
              <th className="th">วันที่ยืนยันส่ง</th>
              <th className="th">สถานะ</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="td" colSpan={9}>กำลังโหลด...</td></tr>}

            {!loading && list.map(r=>(
              <tr key={r.id}>
                <td className="td">{r.request_no}</td>
                <td className="td">
                  {r.requester_name || '-'}
                  { (r.requester_department || r.requester_position) &&
                    <span className="text-white/50">{' '}({r.requester_department || '-'} / {r.requester_position || '-'})</span>
                  }
                </td>
                <td className="td">{r.requester_department || '-'}</td>
                <td className="td">{r.requester_position || '-'}</td>
                <td className="td">{r.items_summary || '-'}</td>
                <td className="td">{Number(r.total_qty||0)}</td>
                <td className="td">{thDateTime(r.submitted_at)}</td>
                <td className="td">{statusTH(r.status)}</td>
                <td className="td flex gap-2">
                  <button className="btn" onClick={()=>approve(r.id)}>อนุมัติ</button>
                  <button className="btn" onClick={()=>reject(r.id)}>ปฏิเสธ</button>
                  {/* ปุ่มลบ (กลับมาแล้ว) */}
                  <button className="btn" onClick={()=>removeReq(r.id)}>ลบ</button>
                </td>
              </tr>
            ))}

            {!loading && !list.length && (
              <tr><td className="td" colSpan={9}>ไม่มีรายการ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
