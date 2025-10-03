'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';

export default function RootPage(){
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(()=>{
    if (loading) return;
    if (!user){
      router.push('/login');
    } else if (['admin','approver','storekeeper'].includes(user.role)){
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return <p className="p-6">กำลังโหลด...</p>;
}
