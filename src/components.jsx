import { useEffect, useRef } from 'react';
import { useApp } from './ctx';
import { baseDocs } from './util';

export function QR({ text }) {
  const ref = useRef();
  useEffect(() => { ref.current.innerHTML = ''; if (window.QRCode) new window.QRCode(ref.current, { text, width: 176, height: 176, colorDark: '#000000', colorLight: '#ffffff' }); else ref.current.textContent = text; }, [text]);
  return <div className="qr" ref={ref} />;
}
export function Modal({ onClose, children }) {
  const r = useRef();
  useEffect(() => { r.current.showModal(); }, []);
  return <dialog ref={r} onClose={onClose}>{children}</dialog>;
}
export function PeopleSelect({ value, onChange }) {
  const { users } = useApp();
  return <select aria-label="ადამიანი" value={value} onChange={e => onChange(e.target.value)}><option value="">ყველა ადამიანი</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>;
}
export function ScopeSelect({ value, onChange }) {
  const { me } = useApp();
  return <select aria-label="ჩემი დავალებები" value={value} onChange={e => onChange(e.target.value)}>
    <option value="all">{me.role === 'admin' ? 'ყველა' : 'ყველა ჩემი'}</option><option value="mine">ჩემი (შექმნილი ან მონიშნული)</option>
    <option value="created">მე შევქმენი</option><option value="assigned">მე ვარ მონიშნული</option></select>;
}
export { baseDocs };
