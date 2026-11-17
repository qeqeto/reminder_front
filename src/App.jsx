import { useCallback, useEffect, useRef, useState } from 'react';
import { api, store, setOnUnauthorized } from './api';
import { connect } from './socket';
import { AppCtx } from './ctx';
import { useHash } from './hooks';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import History from './pages/History.jsx';
import Users from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';
import { DocDialog, PostponeDialog, UserDialog } from './Dialogs.jsx';

export default function App() {
  const [token, setToken] = useState(store.get('t'));
  const [cfg, setCfg] = useState({}), [me, setMe] = useState(null), [users, setUsers] = useState([]), [docs, setDocs] = useState([]), [st, setSt] = useState({ values: {}, has: {} });
  const [dlg, setDlg] = useState(null), [notice, setNotice] = useState(''), [toastMsg, setToastMsg] = useState(''), [live, setLive] = useState(false);
  const [themePref, setThemePref] = useState(store.get('theme') || 'system');
  const meRef = useRef(null), toastT = useRef();
  const page = useHash();

  const toast = useCallback(m => { setToastMsg(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToastMsg(''), 3500); }, []);
  const logout = useCallback((message = '') => { store.del('t'); meRef.current = null; setToken(null); setMe(null); setNotice(message); }, []);
  const onToken = useCallback(t => { store.set('t', t); setToken(t); setNotice(''); }, []);
  useEffect(() => { setOnUnauthorized(() => logout('სესია ამოიწურა, შედი თავიდან')); }, [logout]);

  useEffect(() => { // თემა
    const el = document.documentElement;
    themePref === 'system' ? el.removeAttribute('data-theme') : (el.dataset.theme = themePref);
    store.set('theme', themePref);
  }, [themePref]);
  const isDark = themePref === 'dark' || (themePref === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);

  const load = useCallback(async (m = meRef.current) => {
    if (!m) return;
    const [u, d] = await Promise.all([api('/users'), api('/documents')]);
    setUsers(u.users); setDocs(d);
    if (m.role === 'admin') setSt(await api('/settings'));
  }, []);

  useEffect(() => { api('/public/config', 'GET', undefined, null).then(setCfg).catch(() => {}); }, [token]);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try { const m = await api('/me'); if (!alive) return; meRef.current = m; setMe(m); await load(m); }
      catch (e) { if (e.status !== 401 && alive) setNotice(e.message); }
    })();
    return () => { alive = false; };
  }, [token, load]);

  useEffect(() => { // socket.io: ცვლილებები ყველა ღია ფანჯარაში მყისიერად ჩანს
    if (!token || !me) return;
    const s = connect(token); let t;
    s.on('connect', () => setLive(true)); s.on('disconnect', () => setLive(false));
    s.on('changed', () => { clearTimeout(t); t = setTimeout(() => load().catch(() => {}), 300); });
    return () => { clearTimeout(t); s.disconnect(); setLive(false); };
  }, [token, me?.id, me?.role, load]);

  if (!token) return <Auth cfg={cfg} onToken={onToken} notice={notice} />;
  if (!me) return <div className="auth"><div className="card"><div className="brand"><span className="logo">A</span>APA Reminder</div><p className="mut">იტვირთება…</p>{notice && <><p className="err">{notice}</p><button className="ghost sm" onClick={() => logout()}>უკან შესვლაზე</button></>}</div></div>;

  const adm = me.role === 'admin', pending = users.filter(u => u.approved === false).length;
  const nav = [['dashboard', 'დაფა'], ['history', 'ისტორია'], ...(adm ? [['users', 'მომხმარებლები']] : []), ['settings', 'პარამეტრები']];
  const pg = nav.some(([k]) => k === page) ? page : 'dashboard';
  const ctx = { me, users, docs, st, cfg, toast, reload: load, setDlg, themePref, setThemePref };
  const View = { dashboard: Dashboard, history: History, users: Users, settings: Settings }[pg];
  return (
    <AppCtx.Provider value={ctx}>
      <div className="app">
        <aside>
          <div className="brand"><span className="logo">A</span>APA Reminder</div>
          <nav aria-label="მთავარი მენიუ">{nav.map(([k, t]) => <a key={k} href={`#/${k}`} className={k === pg ? 'on' : ''} aria-current={k === pg ? 'page' : undefined}>{t}{k === 'users' && pending > 0 && <> <span className="badge warn">{pending}</span></>}</a>)}</nav>
          <div className="side-end">
            <div className="mut"><span className={`dot ${live ? 'live' : ''}`} />{live ? 'ლაივ კავშირი' : 'კავშირი…'}</div>
            <button className="ghost sm" onClick={() => setThemePref(isDark ? 'light' : 'dark')}>{isDark ? 'ღია თემა' : 'მუქი თემა'}</button>
            <div className="me"><b>{me.name}</b><br /><span className="mut">{me.email || ''}</span></div>
            <button className="ghost sm" onClick={() => logout()}>გასვლა</button>
          </div>
        </aside>
        <main><View /></main>
      </div>
      {dlg?.type === 'doc' && <DocDialog doc={dlg.doc} onClose={() => setDlg(null)} />}
      {dlg?.type === 'pp' && <PostponeDialog doc={dlg.doc} onClose={() => setDlg(null)} />}
      {dlg?.type === 'user' && <UserDialog onClose={() => setDlg(null)} />}
      {toastMsg && <div id="toast" role="status" style={{ display: 'block' }}>{toastMsg}</div>}
    </AppCtx.Provider>
  );
}
