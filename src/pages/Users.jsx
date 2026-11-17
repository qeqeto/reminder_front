import { api } from '../api';
import { useApp } from '../ctx';

export default function Users() {
  const { me, users, toast, reload, setDlg } = useApp();
  const run = fn => async () => { try { await fn(); } catch (e) { toast(e.message); } };
  const approve = u => run(async () => { await api(`/users/${u.id}/approve`, 'POST'); await reload(); toast('დამტკიცდა'); });
  const del = u => run(async () => { if (confirm('წავშალო მომხმარებელი?')) { await api(`/users/${u.id}`, 'DELETE'); await reload(); } });
  return (
    <>
      <div className="head"><div><h1>მომხმარებლები</h1><p className="mut">{users.length} მომხმარებელი</p></div><button onClick={() => setDlg({ type: 'user' })}>+ მომხმარებელი</button></div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>სახელი</th><th>ელფოსტა</th><th>სტატუსი</th><th>Telegram</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><b>{u.name}</b></td><td>{u.email || '—'}</td>
                <td><span className={`badge ${u.approved ? 'good' : 'warn'}`}>{u.approved ? 'აქტიური' : u.verified ? 'ელოდება დამტკიცებას' : 'ელოდება ვერიფიკაციას'}</span></td>
                <td>{u.tg ? <span className="badge good">დაკავშირებულია</span> : me.bot ? <a href={`https://t.me/${me.bot}?start=${u.link_code}`} target="_blank" rel="noopener noreferrer">ბმული</a> : <span className="mut">—</span>}</td>
                <td><div className="row" style={{ justifyContent: 'flex-end' }}>{!u.approved && <button className="sm" onClick={approve(u)}>დამტკიცება</button>}<button className="danger sm" onClick={del(u)}>წაშლა</button></div></td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={5} className="mut">მომხმარებელი ჯერ არ არის</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
