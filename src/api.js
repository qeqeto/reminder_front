export const BASE = (window.API_URL || (location.hostname === 'localhost' ? 'http://localhost:3000' : '')).replace(/\/+$/, '');
export const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: k => { try { localStorage.removeItem(k); } catch {} },
};
let onUnauthorized = () => {};
export const setOnUnauthorized = f => { onUnauthorized = f; };

// token === undefined: შენახული ტოკენი; token === null: ტოკენის გარეშე
export async function api(path, method = 'GET', body, token) {
  if (!BASE) throw new Error('API_URL არ არის დაყენებული: frontend სერვისის Variables-ში ჩაწერე backend-ის ბმული და გაუშვი Redeploy');
  const tok = token === undefined ? store.get('t') : token;
  let r;
  try {
    r = await fetch(BASE + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new Error('სერვერთან კავშირი ვერ მოხერხდა (' + BASE + '). შეამოწმე API_URL და backend-ის სტატუსი'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && token === undefined && tok) onUnauthorized();
    throw Object.assign(new Error(j.error || 'შეცდომა'), { status: r.status, data: j });
  }
  return j;
}
