export const pad = n => String(n).padStart(2, '0');
export const ms = d => new Date(d) - Date.now();
export const fmt = d => { const x = new Date(d); return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()} ${pad(x.getHours())}:${pad(x.getMinutes())}`; };
export const toInput = d => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`; };
export const span = v => { const m = Math.abs(Math.round(v / 6e4)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), n = m % 60; return d ? `${d} დღე${h ? ' ' + h + ' სთ' : ''}` : h ? `${h} სთ${n ? ' ' + n + ' წთ' : ''}` : `${n} წთ`; };
export const daysLabel = d => ms(d) < 0 ? `გადაცილებულია ${span(ms(d))}` : `დარჩა ${span(ms(d))}`;
export const statusOf = d => { const m = ms(d.deadline); return d.done ? 'done' : m < 0 ? 'overdue' : m <= 7 * 864e5 ? 'soon' : 'later'; };
export const REM = [[10080, '7 დღით ადრე'], [4320, '3 დღით ადრე'], [1440, '1 დღით ადრე'], [120, '2 საათით ადრე'], [60, '1 საათით ადრე'], [0, 'ვადის დადგომისას']];
export const canEdit = (d, me) => me.role === 'admin' || d.created_by === me.id;
export const canAct = (d, me) => canEdit(d, me) || d.user_ids.includes(me.id);
export const summarize = res => { if (!res) return ''; const ok = res.filter(x => x.ok).length, bad = res.filter(x => !x.ok); return `გაიგზავნა: ${ok}` + (bad.length ? `, ვერ გაიგზავნა: ${bad.length} (${bad[0].name}: ${bad[0].error})` : ''); };
export function baseDocs(docs, users, me, f) {
  const sc = f.scope || (me.role === 'admin' ? 'all' : 'mine'), q = f.q.trim().toLowerCase();
  return docs.filter(d => {
    const c = d.created_by === me.id, a = d.user_ids.includes(me.id);
    if (sc === 'mine' && !(c || a) || sc === 'created' && !c || sc === 'assigned' && !a) return false;
    if (f.person && !d.user_ids.includes(+f.person)) return false;
    if (q && !(d.title.toLowerCase().includes(q) || d.user_ids.some(i => (users.find(u => u.id === i)?.name || '').toLowerCase().includes(q)))) return false;
    return true;
  });
}
