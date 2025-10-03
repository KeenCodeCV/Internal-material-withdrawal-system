// apps/web/lib/api.js
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function api(path, opts = {}) {
  const { method = 'GET', body, headers = {} } = opts;

  const url = path.startsWith('http')
    ? path
    : `${API_BASE}/api${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  let json = null;
  try { json = await res.json(); } catch {}

  if (!res.ok) {
    const msg = (json && json.message) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return json ?? {};
}
