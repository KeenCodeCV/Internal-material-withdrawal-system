'use client';
import { useEffect } from 'react';
import { api } from '../../lib/api';
export default function Page(){
  useEffect(()=>{ api('/auth/logout',{method:'POST'}).finally(()=>location.href='/login'); },[]);
  return <p>กำลังออกจากระบบ...</p>;
}