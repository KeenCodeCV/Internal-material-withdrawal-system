'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';

export default function ProfilePage(){
  const { user, loading } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(()=>{
    if (loading) return;
    if (!user) { setBusy(false); return; }
    (async()=>{
      try{
        const r = await api('/profile/me');
        setData(r.data);
      } finally {
        setBusy(false);
      }
    })();
  }, [user, loading]);

  if (loading || busy) return <div className="p-6">กำลังโหลด...</div>;
  if (!user) return <div className="p-6">กรุณาเข้าสู่ระบบ</div>;

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">โปรไฟล์พนักงาน (อ่านอย่างเดียว)</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 bg-white/5 shadow-sm">
          <div className="text-white/70 text-sm">ชื่อพนักงาน</div>
          <div className="text-xl font-semibold">{data?.name || '-'}</div>
        </div>
        <div className="rounded-2xl p-4 bg-white/5 shadow-sm">
          <div className="text-white/70 text-sm">อีเมล</div>
          <div className="text-xl font-semibold">{data?.email || '-'}</div>
        </div>
        <div className="rounded-2xl p-4 bg-white/5 shadow-sm">
          <div className="text-white/70 text-sm">แผนก</div>
          <div className="text-xl font-semibold">{data?.department || '-'}</div>
        </div>
        <div className="rounded-2xl p-4 bg-white/5 shadow-sm">
          <div className="text-white/70 text-sm">ตำแหน่ง</div>
          <div className="text-xl font-semibold">{data?.position || '-'}</div>
        </div>
        <div className="rounded-2xl p-4 bg-white/5 shadow-sm">
          <div className="text-white/70 text-sm">บทบาท</div>
          <div className="text-xl font-semibold">{data?.role || '-'}</div>
        </div>
        <div className="rounded-2xl p-4 bg-white/5 shadow-sm">
          <div className="text-white/70 text-sm">สถานะ</div>
          <div className="text-xl font-semibold">{data?.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}</div>
        </div>
      </div>

      <div className="text-white/60 text-sm">
        * โปรไฟล์นี้แสดงจากข้อมูลบุคคลากรของบริษัท ไม่สามารถแก้ไขได้
      </div>
    </div>
  );
}
