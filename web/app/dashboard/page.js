'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { statusTH } from '../../lib/status';

function StatCard({ label, value, tone='bg-white/5', delay=0 }) {
  return (
    <motion.div
      initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
      transition={{duration:.25, delay}}
      className={`rounded-2xl p-4 ${tone} shadow-sm`}
    >
      <div className="text-sm text-white/70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? 0}</div>
    </motion.div>
  );
}

// ฟอร์แมตวันเวลาไทย
function formatThaiDateTime(dt){
  if (!dt) return '-';
  const d = new Date(dt);
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(d);
}

export default function EmployeeDashboard(){
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async ()=>{
    try{
      const r = await api('/requisitions?mine=1&summary=1');
      setMine(r.data || []);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  const kpi = useMemo(()=>{
    const by = (st)=> mine.filter(x=>x.status===st).length;
    return {
      drafts: by('DRAFT'),
      submitted: by('SUBMITTED'),
      approved: by('APPROVED'),
      rejected: by('REJECTED'),
      totalQty: mine
        .filter(x => x.status==='APPROVED')
        .reduce((s,x)=> s + Number(x.total_qty||0), 0),
    };
  }, [mine]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">แดชบอร์ดผู้ใช้งาน</h1>
          <p className="text-white/60 text-sm mt-1">สรุปสถานะคำขอเบิก และรายการล่าสุดของคุณ</p>
        </div>
        <div className="rounded-full bg-white/5 px-3 py-1.5 text-sm">
          <span className="font-medium">{user?.name || '-'}</span>
          <span className="text-white/60">{' • '}{user?.department || '-'}</span>
          <span className="text-white/60">{' • '}{user?.position || '-'}</span>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard label="รอยืนยัน" value={kpi.drafts}   tone="bg-sky-500/20" />
        <StatCard label="ส่งอนุมัติแล้ว"   value={kpi.submitted} tone="bg-purple-500/20" />
        <StatCard label="อนุมัติแล้ว"      value={kpi.approved}  tone="bg-emerald-500/20" />
        <StatCard label="ปฏิเสธแล้ว"       value={kpi.rejected}  tone="bg-rose-500/20" />
        <StatCard label="จำนวนที่อนุมัติ (รวม)" value={kpi.totalQty} tone="bg-amber-500/20" />
      </div>

      {/* รายการล่าสุด */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-base font-semibold">รายการคำขอล่าสุดของฉัน</div>
          <div className="text-sm text-white/70">
            ไปที่ <a className="underline hover:text-white" href="/requisitions/new">สร้างคำขอ</a> •{' '}
            <a className="underline hover:text-white" href="/requisitions/my">คำขอของฉันทั้งหมด</a>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">เลขที่</th>
                <th className="th">วัสดุ</th>
                <th className="th">จำนวน</th>
                <th className="th">สถานะ</th>
                <th className="th">วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {mine.slice(0,10).map((r,idx)=>(
                  <motion.tr
                    key={r.id}
                    initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-6}}
                    transition={{duration:.18, delay: idx*0.02}}
                  >
                    <td className="td">{r.request_no}</td>
                    <td className="td">{r.items_summary || '-'}</td>
                    <td className="td">{Number(r.total_qty||0)}</td>
                    {/* ใช้สถานะภาษาไทย */}
                    <td className="td">{statusTH(r.status)}</td>
                    <td className="td">{formatThaiDateTime(r.created_at || r.createdAt)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && !mine.length && (
                <tr><td className="td" colSpan={5}>ยังไม่มีคำขอ — เริ่มที่ <a className="underline" href="/requisitions/new">สร้างคำขอ</a></td></tr>
              )}
              {loading && <tr><td className="td" colSpan={5}>กำลังโหลด...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl p-4 bg-white/5">
        <div className="font-medium mb-1">วิธีใช้งานอย่างเร็ว</div>
        <ul className="list-disc list-inside text-white/70 space-y-1 text-sm">
          <li>ไปที่ “สร้างคำขอ” เลือกวัสดุและจำนวน แล้วบันทึกเป็นฉบับร่าง</li>
          <li>กด “ยืนยันส่งอนุมัติ” ระบบจะส่งต่อให้ผู้อนุมัติทันที</li>
          <li>ติดตามสถานะได้ที่ “คำขอของฉัน”</li>
        </ul>
      </div>
    </div>
  );
}
