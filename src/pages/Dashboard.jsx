import { useMemo, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';
import { useTick } from '../hooks';
import { PeopleSelect, ScopeSelect } from '../components.jsx';
import { baseDocs, statusOf, daysLabel, fmt, canEdit, canAct, summarize } from '../util';

function DocRow({ d }) {
  const { me, users, toast, reload, setDlg } = useApp();
  const s = statusOf(d), tone = s === 'overdue' ? 'bad' : s === 'soon' ? 'warn' : '';
  const run = fn => async () => { try { await fn(); } catch (e) { toast(e.message); } };
  const done = run(async () => { await api(`/documents/${d.id}/done`, 'PUT', { done: true }); await reload(); toast('გადავიდა ისტორიაში'); });
  const send = run(async () => toast(summarize((await api(`/documents/${d.id}/notify`, 'POST', {})).results)));
  const del = run(async () => { if (confirm('წავშალო დავალება?')) { await api(`/documents/${d.id}`, 'DELETE'); await reload(); } });
  return (
    <article className={`doc ${s === 'overdue' ? 'late' : s}`}>
      <div>
        <b>{d.title}</b>
        <div className="mut">ვადა: <b>{fmt(d.deadline)}</b>{d.postponed_count ? ` · გადადებულია ×${d.postponed_count}` : ''} · დაამატა {d.creator_name || (d.created_by === 0 ? 'ადმინმა' : '—')}{d.daily ? ` · ყოველდღე ${d.daily_time}` : ''}</div>
        <div>{d.user_ids.map(i => <span className="chip" key={i}>{users.find(u => u.id === i)?.name || '?'}</span>)}{!d.user_ids.length && <span className="mut">არავინ არ არის მონიშნული</span>}</div>
      </div>
      <div className="side">
        <span className={`badge ${tone}`}>{daysLabel(d.deadline)}</span>
        <div className="acts">
          {canAct(d, me) && <button className="sm" onClick={done} title="ერთი მონიშნული პირის დადასტურებაც საკმარისია">შესრულებულია</button>}
          {canAct(d, me) && <button className="ghost sm" onClick={send}>გაგზავნა ახლავე</button>}
          {canAct(d, me) && <button className="ghost sm" onClick={() => setDlg({ type: 'pp', doc: d })}>გადადება</button>}
          {canEdit(d, me) && <button className="ghost sm" onClick={() => setDlg({ type: 'doc', doc: d })}>შეცვლა</button>}
          {canEdit(d, me) && <button className="danger sm" onClick={del}>წაშლა</button>}
        </div>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { me, users, docs, setDlg } = useApp();
  useTick();
  const [f, setF] = useState({ q: '', scope: me.role === 'admin' ? 'all' : 'mine', status: 'active', person: '', sort: 'deadline' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const base = useMemo(() => baseDocs(docs, users, me, f), [docs, users, me, f.q, f.scope, f.person]);
  const cnt = { active: 0, soon: 0, overdue: 0, done: 0 };
  base.forEach(d => { const s = statusOf(d); if (s === 'done') cnt.done++; else if (s === 'overdue') cnt.overdue++; else { cnt.active++; if (s === 'soon') cnt.soon++; } });
  const list = base.filter(d => { const s = statusOf(d); return s !== 'done' && (f.status === 'all' || (f.status === 'active' ? s !== 'overdue' : f.status === 'soon' ? s === 'soon' : s === 'overdue')); })
    .sort((a, b) => f.sort === 'title' ? a.title.localeCompare(b.title, 'ka') : f.sort === 'new' ? b.id - a.id : a.deadline.localeCompare(b.deadline));
  const tiles = [['active', 'აქტიური', cnt.active], ['soon', '7 დღეში', cnt.soon], ['overdue', 'ვადაგასული', cnt.overdue]];
  return (
    <>
      <div className="head"><div><h1>დაფა</h1><p className="mut">დავალებები, ვადები და ადრესატები</p></div><button onClick={() => setDlg({ type: 'doc' })}>+ ახალი დავალება</button></div>
      <div className="stats">
        {tiles.map(([k, t, n]) => <button key={k} className={`stat ${f.status === k ? 'on' : ''}`} onClick={() => set('status', k)}><b>{n}</b><span>{t}</span></button>)}
        <button className="stat" onClick={() => { location.hash = '#/history'; }}><b>{cnt.done}</b><span>ისტორიაში (შესრულებული) →</span></button>
      </div>
      <div className="filters" role="search">
        <input className="full" type="search" placeholder="ძებნა სახელით ან ადამიანით" aria-label="ძებნა" value={f.q} onChange={e => set('q', e.target.value)} />
        <ScopeSelect value={f.scope} onChange={v => set('scope', v)} />
        <select aria-label="სტატუსი" value={f.status} onChange={e => set('status', e.target.value)}>
          {[['active', 'აქტიური'], ['soon', '7 დღეში'], ['overdue', 'ვადაგასული'], ['all', 'ყველა აქტიური']].map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <PeopleSelect value={f.person} onChange={v => set('person', v)} />
        <select aria-label="დალაგება" value={f.sort} onChange={e => set('sort', e.target.value)}>{[['deadline', 'ვადით'], ['new', 'ახალი პირველი'], ['title', 'სახელით']].map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        <button className="ghost" onClick={() => setF({ q: '', scope: me.role === 'admin' ? 'all' : 'mine', status: 'active', person: '', sort: 'deadline' })}>გასუფთავება</button>
      </div>
      {list.length ? list.map(d => <DocRow key={d.id} d={d} />) : (
        <div className="card" style={{ textAlign: 'center' }}><p><b>დავალება ვერ მოიძებნა</b></p><p className="mut">შეცვალე ფილტრები ან დაამატე ახალი დავალება.</p><button onClick={() => setDlg({ type: 'doc' })}>+ ახალი დავალება</button></div>
      )}
    </>
  );
}
