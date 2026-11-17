import { useEffect, useState } from 'react';
export function useTick(sec = 30) { const [, set] = useState(0); useEffect(() => { const i = setInterval(() => set(x => x + 1), sec * 1000); return () => clearInterval(i); }, [sec]); }
export function useHash() {
  const [h, setH] = useState(location.hash);
  useEffect(() => { const f = () => setH(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h.replace(/^#\/?/, '') || 'dashboard';
}
