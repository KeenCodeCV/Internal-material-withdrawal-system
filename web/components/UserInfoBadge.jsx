'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthProvider';

export default function UserInfoBadge(){
  const { user } = useAuth();
  const [me, setMe] = useState(null);

  useEffect(()=>{
    if (!user) { setMe(null); return; }
    (async()=>{
      try{
        const r = await api('/profile/me');
        setMe(r.data);
      }catch{
        setMe(null);
      }
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="ml-auto rounded-full bg-white/5 px-3 py-1.5 text-sm">
      <span className="font-medium">{me?.name || user?.name || '-'}</span>
      <span className="text-white/60">{' • '}{me?.department || '-'}</span>
      <span className="text-white/60">{' • '}{me?.position || '-'}</span>
    </div>
  );
}
