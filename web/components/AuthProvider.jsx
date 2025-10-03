'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const AuthCtx = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    fetch('http://localhost:4000/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error('unauth');
        const j = await r.json();
        setState({ user: j.user, loading: false });
      })
      .catch(() => setState({ user: null, loading: false }));
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const PUBLIC = ['/login', '/logout']; // ✅ หน้าไม่ต้องล็อกอิน

  // ถ้าเป็นหน้า public ให้แสดงได้เลย
  if (PUBLIC.includes(pathname)) return children;

  if (loading) return <div className="p-6 text-white/70">กำลังตรวจสอบสิทธิ์...</div>;
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }
  return children;
}
