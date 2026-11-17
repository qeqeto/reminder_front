import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';
import { QR } from '../components.jsx';
import { fmt } from '../util';

export default function Settings() {
  const { me, st, toast, reload, themePref, setThemePref } = useApp();
  const adm = me.role === 'admin', v = st.values || {}, h = st.has || {};
  const link = me.bot && me.link_code ? `https://t.me/${me.bot}?start=${me.link_code}` : '';
  const [sched, setSched] = useState(null);
  const loadSched = () => { if (adm) api('/scheduler').then(setSched).catch(() => {}); };
  useEffect(loadSched, [adm]);
  const run = fn => async ev => { ev?.preventDefault?.(); try { await fn(ev); } catch (e) { toast(e.message); } };
  const savePw = run(async ev => { const f = Object.fromEntries(new FormData(ev.target)); await api('/me/password', 'POST', { old: f.old, next: f.next }); ev.target.reset(); toast('პაროლი შეიცვალა'); });
  const saveSettings = run(async ev => {
    const f = Object.fromEntries(new FormData(ev.target));
    await api('/settings', 'PUT', { TELEGRAM_BOT_TOKEN: f.tok, SMTP_HOST: f.host, SMTP_PORT: f.port, SMTP_USER: f.user, SMTP_PASS: f.pass, SMTP_FROM: f.from, DEFAULT_DAILY_TIME: f.dtime });
    await reload(); toast('შენახულია');
  });
  const testMail = run(async () => { const x = await api('/settings/test-email', 'POST', {}); toast('გაიგზავნა: ' + x.to); });
  const runNow = run(async () => { const r = await api('/run-reminders', 'POST'); loadSched(); toast(r.log.length ? r.log.join('; ') : 'გასაგზავნი არაფერია'); });
  return (
    <>
      <div className="head"><h1>პარამეტრები</h1></div>
      <div className="card"><h2>გარეგნობა</h2>
        <div className="seg" role="group" aria-label="თემა">{[['system', 'სისტემის'], ['light', 'ღია'], ['dark', 'მუქი']].map(([k, t]) => <button key={k} className={themePref === k ? 'on' : ''} onClick={() => setThemePref(k)}>{t}</button>)}</div>
      </div>
      <div className="card"><h2>პროფილი</h2>
        <p><b>{me.name}</b> <span className="mut">{me.email || ''}</span></p>
        {adm ? <p className="mut">ადმინის ანგარიში. პაროლი Railway Variables-ში იცვლება.</p> : (
          <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}>
            <div><h3>Telegram</h3>
              {me.tg ? <span className="badge good">დაკავშირებულია</span> : link ? <><p className="mut">დაასკანირე და დააჭირე Start, რომ შეხსენებები Telegram-ზეც მიიღო.</p><QR text={link} /><div><a href={link} target="_blank" rel="noopener noreferrer">გახსენი Telegram</a></div></> : <span className="mut">ბოტი ჯერ არ არის გამართული</span>}
            </div>
            <form onSubmit={savePw} className="stack grow" autoComplete="off"><h3>პაროლის შეცვლა</h3>
              <input name="old" type="password" placeholder="ძველი პაროლი" autoComplete="current-password" />
              <input name="next" type="password" minLength={8} placeholder="ახალი პაროლი (8+)" required autoComplete="new-password" />
              <div><button className="sm">შენახვა</button></div></form>
          </div>)}
      </div>
      {adm && <>
        <div className="card"><h2>შეხსენებების სერვისი</h2>
          <p>{sched?.lastRun ? <><span className="dot live" />ბოლო გაშვება: <b>{fmt(sched.lastRun)}</b> · ბოლოს გაიგზავნა: {sched.lastSent} · სულ: {sched.totalSent}</> : <><span className="dot" />ჯერ არ გაშვებულა (სერვისი წუთში ერთხელ მუშაობს)</>}</p>
          {sched?.lastError && <p className="err">შეცდომა: {sched.lastError}</p>}
          <button className="ghost" onClick={runNow}>შეხსენებების გაშვება ახლა</button>
        </div>
        <div className="card"><h2>ინტეგრაციები</h2>
          <form key={JSON.stringify(v) + JSON.stringify(h)} onSubmit={saveSettings} className="stack" autoComplete="off">
            <div><h3>ყოველდღიური შეხსენების ნაგულისხმევი დრო</h3>
              <div className="inline"><input name="dtime" type="time" defaultValue={v.DEFAULT_DAILY_TIME || '10:00'} aria-label="ნაგულისხმევი დრო" /><span className="mut">თბილისის დროით. თითოეულ დავალებაზე ცალკე შეიძლება შეიცვალოს.</span></div></div>
            <div><h3>Telegram ბოტი {h.TELEGRAM_BOT_TOKEN ? <span className="badge good">მიერთებულია</span> : <span className="badge warn">არ არის მიერთებული</span>}</h3>
              <input name="tok" type="password" autoComplete="off" style={{ width: '100%' }} placeholder={h.TELEGRAM_BOT_TOKEN ? 'ტოკენი შენახულია (შესაცვლელად ჩაწერე ახალი)' : 'ბოტის ტოკენი (@BotFather)'} aria-label="ბოტის ტოკენი" />
              {v.TELEGRAM_BOT_USERNAME && <p className="mut" style={{ marginTop: 6 }}>ბოტი: @{v.TELEGRAM_BOT_USERNAME}</p>}</div>
            <div><h3>ელფოსტა (SMTP) {h.SMTP_PASS && v.SMTP_HOST ? <span className="badge good">გამართულია</span> : <span className="badge warn">არ არის გამართული</span>}</h3>
              <div className="row"><input className="grow" name="host" placeholder="SMTP სერვერი" defaultValue={v.SMTP_HOST || ''} aria-label="SMTP სერვერი" /><input name="port" style={{ width: 90 }} placeholder="პორტი" defaultValue={v.SMTP_PORT || '587'} aria-label="პორტი" /></div>
              <div className="row" style={{ marginTop: 8 }}><input className="grow" name="user" placeholder="მომხმარებელი" defaultValue={v.SMTP_USER || ''} aria-label="SMTP მომხმარებელი" autoComplete="off" /><input className="grow" name="pass" type="password" autoComplete="new-password" placeholder={h.SMTP_PASS ? 'პაროლი შენახულია' : 'პაროლი / App Password'} aria-label="SMTP პაროლი" /></div>
              <input name="from" style={{ width: '100%', marginTop: 8 }} placeholder="გამგზავნი (From)" defaultValue={v.SMTP_FROM || ''} aria-label="From" /></div>
            <p className="mut">რეგისტრაციისას დადასტურება მიდის მეილზე (თუ SMTP გამართულია) და/ან Telegram-ით QR კოდით (თუ ბოტია მიერთებული). ვერიფიკაციის შემდეგ ახალ მომხმარებელს დამატებით ადმინი ამტკიცებს.</p>
            <div className="row"><button>შენახვა</button><button type="button" className="ghost" onClick={testMail}>სატესტო მეილი</button></div>
          </form>
        </div></>}
    </>
  );
}
