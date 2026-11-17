import { useEffect, useState } from 'react';
import { api } from '../api';
import { QR } from '../components.jsx';

function Verify({ v, cfg, onToken, onBack }) {
  const m = v.methods || cfg;
  const [sent, setSent] = useState(false), [cool, setCool] = useState(0), [tg, setTg] = useState(''), [waiting, setWaiting] = useState(false), [msg, setMsg] = useState('');
  useEffect(() => {
    const id = setInterval(async () => {
      try { const r = await api('/verify/status', 'GET', undefined, v.pending); if (r.token) onToken(r.token); else if (r.verified) setWaiting(true); }
      catch (e) { if (e.status === 401) onBack('ვერიფიკაციის სესია ამოიწურა, შედი თავიდან'); }
    }, 3000);
    return () => clearInterval(id);
  }, [v.pending]);
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);
  const call = (fn) => async (ev) => { ev?.preventDefault?.(); setMsg(''); try { await fn(ev); } catch (e) { setMsg(e.message); } };
  const sendCode = call(async () => { await api('/verify/email/send', 'POST', {}, v.pending); setSent(true); setCool(60); });
  const confirmCode = call(async ev => {
    const r = await api('/verify/email/confirm', 'POST', { code: new FormData(ev.target).get('code') }, v.pending);
    if (r.token) onToken(r.token); else setWaiting(true);
  });
  const startTg = call(async () => setTg((await api('/verify/telegram/start', 'POST', {}, v.pending)).link));
  if (waiting) return (
    <div className="auth"><div className="card"><h1>ელოდება დამტკიცებას</h1><p className="mut" style={{ marginTop: 6 }}>{v.email}</p>
      <div className="opt">ანგარიში დადასტურებულია ✅ ახლა ადმინმა უნდა დაგიმტკიცოს წვდომა. დამტკიცებისთანავე ეს გვერდი თავისით გაგრძელდება, ან შეგიძლია მოგვიანებით შეხვიდე.</div>
      <button className="ghost sm" style={{ marginTop: 12 }} onClick={() => onBack('')}>უკან შესვლაზე</button></div></div>
  );
  return (
    <div className="auth"><div className="card"><h1>ანგარიშის დადასტურება</h1><p className="mut" style={{ marginTop: 6 }}>{v.email}</p>
      {!m.email && !m.telegram && <div className="opt">ავტომატური დადასტურება ჯერ ჩართული არ არის. ანგარიშს ადმინი დაგიმტკიცებს. ეს გვერდი თავისით განახლდება.</div>}
      {m.telegram && <div className="opt"><h3>Telegram-ით</h3><p className="mut">დაასკანირე QR კოდი ან გახსენი ბმული და ბოტში დააჭირე Start.</p>
        {tg ? <><QR text={tg} /><div><a href={tg} target="_blank" rel="noopener noreferrer">გახსენი Telegram</a></div><p className="mut">ველოდები დადასტურებას…</p></> : <button onClick={startTg}>QR კოდის გენერაცია</button>}</div>}
      {m.email && <div className="opt"><h3>ელფოსტით</h3>
        {sent ? <><form onSubmit={confirmCode} className="row"><input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6-ციფრიანი კოდი" required autoComplete="one-time-code" className="grow" /><button>დადასტურება</button></form>
          <button className="ghost sm" style={{ marginTop: 10 }} onClick={sendCode} disabled={cool > 0}>{cool > 0 ? `თავიდან გაგზავნა (${cool} წმ)` : 'კოდის თავიდან გაგზავნა'}</button></>
          : <><p className="mut">6-ციფრიან კოდს გამოგიგზავნით.</p><button onClick={sendCode}>კოდის გაგზავნა</button></>}</div>}
      <p className="err" role="alert" style={{ marginTop: 12 }}>{msg}</p>
      <button className="ghost sm" onClick={() => onBack('')}>უკან შესვლაზე</button></div></div>
  );
}

export default function Auth({ cfg, onToken, notice }) {
  const [tab, setTab] = useState('login'), [msg, setMsg] = useState(notice || ''), [v, setV] = useState(null);
  useEffect(() => { if (notice) setMsg(notice); }, [notice]);
  async function submit(e) {
    e.preventDefault(); setMsg('');
    const f = Object.fromEntries(new FormData(e.target));
    try {
      if (tab === 'register') { const r = await api('/register', 'POST', f, null); setV({ pending: r.pending, email: f.email, methods: r.methods }); }
      else onToken((await api('/login', 'POST', f, null)).token);
    } catch (err) { if (err.data?.pending) setV({ pending: err.data.pending, email: f.email, methods: err.data.methods }); else setMsg(err.message); }
  }
  if (v) return <Verify v={v} cfg={cfg} onToken={onToken} onBack={m => { setV(null); setMsg(m || ''); }} />;
  const reg = tab === 'register';
  return (
    <div className="auth"><div className="card">
      <div className="brand" style={{ paddingBottom: 12 }}><span className="logo">A</span>APA Reminder</div>
      <div className="tabs"><button className={reg ? '' : 'on'} onClick={() => { setTab('login'); setMsg(''); }}>შესვლა</button><button className={reg ? 'on' : ''} onClick={() => { setTab('register'); setMsg(''); }}>რეგისტრაცია</button></div>
      <form onSubmit={submit} className="stack" key={tab}>
        {reg && <div><label htmlFor="n">სახელი</label><input id="n" name="name" required autoComplete="name" style={{ width: '100%' }} /></div>}
        <div><label htmlFor="e">ელფოსტა</label><input id="e" name="email" type="email" required autoComplete="email" style={{ width: '100%' }} /></div>
        <div><label htmlFor="p">პაროლი{reg ? ' (მინიმუმ 8 სიმბოლო)' : ''}</label><input id="p" name="password" type="password" required minLength={reg ? 8 : 1} autoComplete={reg ? 'new-password' : 'current-password'} style={{ width: '100%' }} /></div>
        <button style={{ width: '100%' }}>{reg ? 'ანგარიშის შექმნა' : 'შესვლა'}</button>
        <p className="err" role="alert">{msg}</p>
      </form></div></div>
  );
}
