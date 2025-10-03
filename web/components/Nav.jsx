'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import UserInfoBadge from './UserInfoBadge';

export default function Nav(){
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(0);

  useEffect(()=>{
    let t;
    async function fetchPending(){
      try{
        if (user && (user.role==='admin' || user.role==='approver')){
          const r = await fetch('http://localhost:4000/api/requisitions?status=SUBMITTED&summary=1', { credentials:'include' });
          const j = await r.json();
          setPending(j?.data?.length || 0);
        }
      }catch{}
      t = setTimeout(fetchPending, 15000);
    }
    fetchPending();
    return ()=> t && clearTimeout(t);
  }, [user]);

  const isAdminLike = user && (user.role==='admin' || user.role==='approver');

  return (
    <nav className="nav flex gap-2 items-center">
      <Link href="/">แดชบอร์ด</Link>
      <Link href="/items">วัสดุ</Link>

      {!isAdminLike && (
        <>
          <Link href="/requisitions/new">สร้างคำขอ</Link>
          <Link href="/requisitions/my">คำขอของฉัน</Link>
        </>
      )}

      {isAdminLike && (
        <>
          <Link href="/approvals" className="relative">
            อนุมัติ
            {pending>0 && (
              <span className="absolute -top-2 -right-3 text-xs bg-purple-500 text-white rounded-full px-2 py-0.5">{pending}</span>
            )}
          </Link>
          <Link href="/approvals/history">ประวัติอนุมัติ/ปฏิเสธ</Link>
        </>
      )}

      {/* มุมขวาบน: ข้อมูลผู้ใช้ */}
      <UserInfoBadge />
    </nav>
  );
}
