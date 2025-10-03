'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { api } from '../../lib/api';
import { motion } from 'framer-motion';

export default function AdminDashboard(){
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const canView = user && ['admin','approver','storekeeper'].includes(user.role);

  useEffect(()=>{
    if (!canView) return;
    (async()=>{
      try{
        const res = await api('/admin/metrics');
        setData(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [canView]);

  if (!canView) {
    return (
      <div className="p-6 space-y-3">
        <h3 className="text-lg font-semibold">ไม่อนุญาต</h3>
        <p className="text-white/70">หน้าแดชบอร์ดผู้ดูแลเข้าถึงได้เฉพาะผู้มีสิทธิ์เท่านั้น</p>
      </div>
    );
  }

  if (loading) return <div className="p-6">กำลังโหลดแดชบอร์ด...</div>;

  const k = data?.kpi || {};
  const trend = data?.trend30d || [];
  const top10  = data?.top10 || [];
  const waiting = data?.waiting || [];

  const cards = [
    { label: 'คำขอรออนุมัติ', value: k.pending, tone: 'bg-purple-500/20' },
    { label: 'อนุมัติวันนี้', value: k.approved_today, tone: 'bg-emerald-500/20' },
    { label: 'ปฏิเสธวันนี้', value: k.rejected_today, tone: 'bg-rose-500/20' },
    { label: 'ฉบับร่าง (DRAFT)', value: k.drafts, tone: 'bg-sky-500/20' },
    { label: 'วัสดุทั้งหมด', value: k.total_items, tone: 'bg-indigo-500/20' },
    { label: 'คงคลังรวม', value: k.total_stock, tone: 'bg-amber-500/20' },
    { label: 'หมดสต็อก', value: k.out_of_stock, tone: 'bg-red-500/20' },
    { label: 'ผู้ใช้งาน', value: k.total_users, tone: 'bg-teal-500/20' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">แดชบอร์ดผู้ดูแล — สรุปสถานะระบบ</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-sky-500/20">{user.role}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {cards.map((c, idx)=>(
          <motion.div
            key={c.label}
            initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{delay: idx*0.03}}
            className={`rounded-2xl p-4 ${c.tone} shadow-sm`}
          >
            <div className="text-sm text-white/70">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.value ?? 0}</div>
          </motion.div>
        ))}
      </div>

      {/* Trend (30 วัน) */}
      <div className="card p-4">
        <div className="text-base font-semibold mb-2">แนวโน้มการอนุมัติ (30 วันล่าสุด)</div>
        {trend.length ? (
          <div className="text-sm text-white/80 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {trend.map(t=>(
              <div key={t.d} className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                <span>{t.d}</span>
                <span className="font-semibold">{t.qty}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/60">ยังไม่มีข้อมูล</div>
        )}
      </div>

      {/* Top 10 วัสดุยอดเบิก */}
      <div className="card p-4">
        <div className="text-base font-semibold mb-2">Top 10 วัสดุยอดเบิก (30 วัน)</div>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">รหัส</th>
                <th className="th">ชื่อ</th>
                <th className="th">หน่วย</th>
                <th className="th">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              {top10.map(it=>(
                <tr key={it.code}>
                  <td className="td">{it.code}</td>
                  <td className="td">{it.name}</td>
                  <td className="td">{it.unit}</td>
                  <td className="td">{it.qty}</td>
                </tr>
              ))}
              {!top10.length && <tr><td className="td" colSpan={4}>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* คำขอรออนุมัติล่าสุด (เพิ่มคอลัมน์ แผนก/ตำแหน่ง) */}
      <div className="card p-4">
        <div className="text-base font-semibold mb-2">คำขอรออนุมัติล่าสุด</div>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">เลขที่</th>
                <th className="th">ผู้ขอ</th>
                <th className="th">แผนก</th>
                <th className="th">ตำแหน่ง</th>
                <th className="th">วัสดุ</th>
                <th className="th">จำนวนรวม</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map(w=>(
                <tr key={w.id}>
                  <td className="td">{w.request_no}</td>
                  <td className="td">{w.requester_name || '-'}</td>
                  <td className="td">{w.requester_department || '-'}</td>
                  <td className="td">{w.requester_position || '-'}</td>
                  <td className="td">{w.items_summary || '-'}</td>
                  <td className="td">{w.total_qty || 0}</td>
                </tr>
              ))}
              {!waiting.length && <tr><td className="td" colSpan={6}>ไม่มีรายการ</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
