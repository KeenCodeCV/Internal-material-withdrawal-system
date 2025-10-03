'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { statusTH } from '../../../lib/status';

function thDT(dt){
  if(!dt) return '-';
  const d = new Date(dt);
  return new Intl.DateTimeFormat('th-TH',{ dateStyle:'medium', timeStyle:'short', hour12:false, timeZone:'Asia/Bangkok'}).format(d);
}

async function fetchList(status){
  const r = await fetch(`http://localhost:4000/api/requisitions?status=${status}&summary=1`,{ credentials:'include' });
  if(!r.ok) return [];
  return (await r.json()).data || [];
}

export default function History(){
  const { user, loading } = useAuth();
  const [approved,setApproved] = useState([]);
  const [rejected,setRejected] = useState([]);

  useEffect(()=>{
    (async ()=>{
      setApproved(await fetchList('APPROVED'));
      setRejected(await fetchList('REJECTED'));
    })();
  },[]);

  if (loading) return <p>กำลังโหลด...</p>;
  if (!(user && (user.role==='admin'||user.role==='approver'))) return <p>ไม่อนุญาต</p>;

  return (
    <div className="p-6 space-y-6">
      <section>
        <h3 className="font-medium mb-2">อนุมัติแล้ว</h3>
        <table className="table">
          <thead>
            <tr>
              <th className="th">เลขที่</th>
              <th className="th">ผู้ขอ</th>
              <th className="th">แผนก</th>
              <th className="th">ตำแหน่ง</th>
              <th className="th">วันที่ดำเนินการ</th>
              <th className="th">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {approved.map(r=>(
              <tr key={r.id}>
                <td className="td">{r.request_no}</td>
                <td className="td">{r.requester_name}</td>
                <td className="td">{r.requester_department}</td>
                <td className="td">{r.requester_position}</td>
                <td className="td">{thDT(r.approve_at)}</td>
                <td className="td">{statusTH(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="font-medium mb-2">ปฏิเสธแล้ว</h3>
        <table className="table">
          <thead>
            <tr>
              <th className="th">เลขที่</th>
              <th className="th">ผู้ขอ</th>
              <th className="th">แผนก</th>
              <th className="th">ตำแหน่ง</th>
              <th className="th">วันที่ดำเนินการ</th>
              <th className="th">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rejected.map(r=>(
              <tr key={r.id}>
                <td className="td">{r.request_no}</td>
                <td className="td">{r.requester_name}</td>
                <td className="td">{r.requester_department}</td>
                <td className="td">{r.requester_position}</td>
                <td className="td">{thDT(r.approve_at)}</td>
                <td className="td">{statusTH(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
