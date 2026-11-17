import { useState } from 'react';
import { api } from './api';
import { useApp } from './ctx';
import { Modal } from './components.jsx';
import { REM, toInput, fmt, summarize } from './util';

export function DocDialog({ doc, onClose }) {
  const { me, users, toast, reload } = useApp();
  const adm = me.role === 'admin';
  const e = doc || { id: null, title: '', deadline: new Date(Date.now() + 10 * 864e5).toISOString(), remind_mins: [60, 0], daily: true, daily_time: me.defaults?.daily_time || '10:00', user_ids: adm ? [] : [me.id] };
  const [daily, setDaily] = useState(e.daily);
  const people = users.filter(u => u.approved !== false && u.verified !== false);
  async function submit(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const b = { title: fd.get('title'), deadline: new Date(fd.get('deadline')).toISOString(), remind_mins: fd.getAll('rd').map(Number),
      user_ids: fd.getAll('u').map(Number), daily: fd.has('daily'), daily_time: fd.get('daily_time') || undefined, notify: !e.id && fd.has('notify') };
    try {
      const res = await api(e.id ? '/documents/' + e.id : '/documents', e.id ? 'PUT' : 'POST', b);
      onClose(); await reload(); if (res.results) toast(summarize(res.results));
    } catch (err) { toast(err.message); }
  }
  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <h2>{e.id ? 'დავალების შეცვლა' : 'ახალი დავალება'}</h2>
        <div><label htmlFor="t">დოკუმენტის სახელი</label><input id="t" name="title" required defaultValue={e.title} style={{ width: '100%' }} /></div>
        <div>
          <label htmlFor="dd">გადაგზავნის ვადა (თარიღი და დრო)</label>
          <input id="dd" name="deadline" type="datetime-local" required defaultValue={toInput(e.deadline)} />
          {!e.id && <p className="mut" style={{ marginTop: 6 }}>ნაგულისხმევი ვადა: ახლიდან 10 დღე. შეგიძლია შეცვალო.</p>}
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <label>ყოველდღიური შეხსენება</label>
          <div className="inline">
            <label className="chk"><input type="checkbox" name="daily" checked={daily} onChange={ev => setDaily(ev.target.checked)} />ყოველდღე</label>
            <label htmlFor="dt" className="mut" style={{ margin: 0 }}>საათზე:</label>
            <input id="dt" name="daily_time" type="time" defaultValue={e.daily_time || '10:00'} disabled={!daily} />
          </div>
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <label>დამატებითი ზუსტი შეხსენებები</label>
          <div className="checks">{REM.map(([n, t]) => <label key={n}><input type="checkbox" name="rd" value={n} defaultChecked={e.remind_mins.includes(n)} />{t}</label>)}</div>
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <label>ვის მიუვიდეს შეხსენება (საკმარისია ერთმა მონიშნულმა დაადასტუროს შესრულება)</label>
          <div className="checks">{people.map(u => <label key={u.id}><input type="checkbox" name="u" value={u.id} defaultChecked={e.user_ids.includes(u.id)} />{u.name}</label>)}
            {!people.length && <span className="mut">მომხმარებლები ჯერ არ არის</span>}</div>
        </fieldset>
        {!e.id && <label className="chk"><input type="checkbox" name="notify" />შექმნისთანავე გაუგზავნე შეტყობინება მონიშნულებს</label>}
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="ghost" onClick={onClose}>გაუქმება</button><button>{e.id ? 'შენახვა' : 'დამატება'}</button></div>
      </form>
    </Modal>
  );
}

export function PostponeDialog({ doc, onClose }) {
  const { toast, reload } = useApp();
  const apply = async iso => {
    try { await api(`/documents/${doc.id}/deadline`, 'PUT', { deadline: iso }); onClose(); await reload(); toast('ვადა შეიცვალა'); }
    catch (e) { toast(e.message); }
  };
  const quick = m => apply(new Date(Math.max(new Date(doc.deadline).getTime(), Date.now()) + m * 6e4).toISOString());
  return (
    <Modal onClose={onClose}>
      <div className="stack">
        <h2>დავალების გადადება</h2>
        <p><b>{doc.title}</b><br /><span className="mut">ახლანდელი ვადა: {fmt(doc.deadline)}</span></p>
        <div className="row">{[[60, '+1 საათი'], [1440, '+1 დღე'], [4320, '+3 დღე'], [10080, '+1 კვირა']].map(([m, t]) => <button key={m} className="ghost" onClick={() => quick(m)}>{t}</button>)}</div>
        <form className="stack" onSubmit={ev => { ev.preventDefault(); apply(new Date(new FormData(ev.target).get('deadline')).toISOString()); }}>
          <div><label htmlFor="nd">ან აირჩიე ახალი თარიღი და დრო</label><input id="nd" name="deadline" type="datetime-local" required defaultValue={toInput(doc.deadline)} /></div>
          <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="ghost" onClick={onClose}>დახურვა</button><button>ვადის შეცვლა</button></div>
        </form>
      </div>
    </Modal>
  );
}

export function UserDialog({ onClose }) {
  const { toast, reload } = useApp();
  async function submit(ev) {
    ev.preventDefault();
    try { await api('/users', 'POST', Object.fromEntries(new FormData(ev.target))); onClose(); await reload(); }
    catch (e) { toast(e.message); }
  }
  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="stack" autoComplete="off">
        <h2>ახალი მომხმარებელი</h2>
        <div><label htmlFor="un">სახელი</label><input id="un" name="name" required autoComplete="off" style={{ width: '100%' }} /></div>
        <div><label htmlFor="ue">ელფოსტა</label><input id="ue" name="email" type="email" required autoComplete="off" style={{ width: '100%' }} /></div>
        <div><label htmlFor="up">პაროლი (მინიმუმ 8 სიმბოლო)</label><input id="up" name="password" type="password" minLength={8} required autoComplete="new-password" style={{ width: '100%' }} /></div>
        <p className="mut">ადმინის მიერ დამატებული მომხმარებელი დადასტურებულად და დამტკიცებულად ითვლება.</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="ghost" onClick={onClose}>გაუქმება</button><button>დამატება</button></div>
      </form>
    </Modal>
  );
}
