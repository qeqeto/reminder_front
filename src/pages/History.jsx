import { useMemo, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';
import { PeopleSelect, ScopeSelect } from '../components.jsx';
import { baseDocs, fmt, span, ms, canEdit, canAct } from '../util';

export default function History() {
  const { me, users, docs, toast, reload, setDlg } = useApp();
  const [f, setF] = useState({ q: '', scope: me.role === 'admin' ? 'all' : 'mine', person: '' });
  const list = useMemo(() => baseDocs(docs, users, me, f).filter(d => d.done).sort((a, b) => new Date(b.done_at || 0) - new Date(a.done_at || 0)), [docs, users, me, f]);
  const run = fn => async () => { try { await fn(); } catch (e) { toast(e.message); } };
  const restore = d => run(async () => {
    await api(`/documents/${d.id}/done`, 'PUT', { done: false }); await reload(); location.hash = '#/dashboard'; toast('დავალება აღდგა');
    if (ms(d.deadline) < 0) { setDlg({ type: 'pp', doc: d }); toast('ვადა გასულია, აირჩიე ახალი ვადა'); }
  });
  const del = d => run(async () => { if (confirm('წავშალო დავალება?')) { await api(`/documents/${d.id}`, 'DELETE'); await reload(); } });
  return (
    <>
      <div className="head"><div><h1>ისტორია</h1><p className="mut">შესრულებული დავალებები. საჭიროების შემთხვევაში აღადგინე.</p></div></div>
      <div className="filters h" role="search">
        <input type="search" placeholder="ძებნა სახელით ან ადამიანით" aria-label="ძებნა" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
        <ScopeSelect value={f.scope} onChange={v => setF({ ...f, scope: v })} />
        <PeopleSelect value={f.person} onChange={v => setF({ ...f, person: v })} />
      </div>
      {list.length ? list.map(d => {
        const late = d.done_at && new Date(d.done_at) > new Date(d.deadline);
        return (
          <article className="doc hist" key={d.id}>
            <span aria-hidden="true" style={{ fontSize: 20, color: 'var(--good)' }}>✓</span>
            <div>
              <b>{d.title}</b>
              <div className="mut">ვადა: {fmt(d.deadline)} · შეასრულა <b>{d.done_by_name || '—'}</b>{d.done_at ? ` (${fmt(d.done_at)})` : ''}{d.postponed_count ? ` · გადადებულია ×${d.postponed_count}` : ''}</div>
              <div>{d.user_ids.map(i => <span className="chip" key={i}>{users.find(u => u.id === i)?.name || '?'}</span>)}</div>
            </div>
            <div className="side">
              <span className={`badge ${late ? 'bad' : 'good'}`}>{late ? 'დაგვიანებით: ' + span(new Date(d.done_at) - new Date(d.deadline)) : 'დროულად'}</span>
              <div className="acts">
                {canAct(d, me) && <button className="sm" onClick={restore(d)}>აღდგენა</button>}
                {canEdit(d, me) && <button className="danger sm" onClick={del(d)}>წაშლა</button>}
              </div>
            </div>
          </article>
        );
      }) : <div className="card" style={{ textAlign: 'center' }}><p><b>ისტორია ცარიელია</b></p><p className="mut">შესრულებულად მონიშნული დავალებები აქ გამოჩნდება.</p></div>}
    </>
  );
}
