'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Leaf, X } from '@phosphor-icons/react';
import Shell from '@/components/pages/Shell';
import { clientId } from '@/lib/client/id';
import { useLanguage } from '@/lib/client/language';
import { cardLabel } from '@/lib/i18n';
import localPlaces from '@/lib/data/generated/dia_diem.json';
import type { Route } from '@/lib/schema';

const MODES: Route['modes'] = ['metro', 'walk', 'bus', 'bike', 'motorbike', 'car'];
const GREEN = new Set(['metro', 'walk', 'bus', 'bike']);

// Post a route: pick verified places in order. It waits for review before others see it.
export default function PostRoute() {
  const { lang } = useLanguage();
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const options = useMemo(() => localPlaces.filter(p => p.trang_thai === 'hoat_dong').map(p => ({ id: p.id, name: lang === 'vi' ? p.ten_vi : p.ten_en, district: p.khu })).sort((a, b) => a.name.localeCompare(b.name, 'vi')), [lang]);
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [modes, setModes] = useState<Route['modes']>(['walk']);
  const [stops, setStops] = useState<{ place_id: string; note: string }[]>([]);
  const [pick, setPick] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'error' | { id: string }>('idle');
  const green = modes.length > 0 && modes.every(m => GREEN.has(m));
  const name = (id: string) => options.find(o => o.id === id)?.name ?? id;
  const move = (i: number, d: number) => setStops(s => { const n = [...s]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j], n[i]]; return n; });
  if (typeof state === 'object') return (
    <Shell title={L('Đã gửi lộ trình', 'Route sent')} lead={L('Lộ trình đang chờ kiểm duyệt. Bạn đã thấy nó trong trang Lộ trình; mọi người sẽ thấy sau khi nhóm kiểm xong.', 'Your route is waiting for review. You can already see it on the Routes page; everyone else will see it once it has been checked.')}>
      <div className="community-actions"><Link href={`/lo-trinh/${state.id}`} className="btn btn-primary">{L('Xem lộ trình', 'Open route')}</Link><Link href="/lo-trinh" className="btn btn-ghost">{L('Tất cả lộ trình', 'All routes')}</Link></div>
    </Shell>
  );
  return (
    <Shell title={L('Đăng lộ trình', 'Post a route')} lead={L('Biến chuyến đi của bạn thành lộ trình người khác đi theo được, không cần quay dựng video. Chọn các điểm dừng theo thứ tự; mỗi điểm là một địa điểm đã kiểm nguồn.', 'Turn your trip into a route others can follow, no video editing needed. Pick the stops in order; each one is a place with a checked source.')}>
      <form className="community-form" onSubmit={async e => {
        e.preventDefault(); setState('sending');
        try { const r = await fetch('/api/routes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ author, title, summary, modes, stops: stops.map(s => ({ place_id: s.place_id, ...(s.note.trim() ? { note: s.note.trim() } : {}) })), client_id: clientId() }) }); setState(r.ok ? { id: (await r.json()).id } : 'error'); } catch { setState('error'); }
      }}>
        <label>{L('Tên hiển thị', 'Display name')}<input required minLength={2} maxLength={40} value={author} onChange={e => setAuthor(e.target.value)} placeholder={L('Ví dụ: Huy Hẻm Hóc', 'e.g. Alley Hunter')} /></label>
        <label>{L('Tên lộ trình', 'Route title')}<input required minLength={4} maxLength={90} value={title} onChange={e => setTitle(e.target.value)} placeholder={L('Ví dụ: Một buổi sáng ở Quận 3', 'e.g. A morning in District 3')} /></label>
        <label>{L('Mô tả ngắn', 'Short description')}<textarea maxLength={300} value={summary} onChange={e => setSummary(e.target.value)} /></label>
        <fieldset><legend>{L('Đi bằng gì', 'How you got around')}</legend><div className="card-actions">{MODES.map(m => <button type="button" key={m} className={`small-button${modes.includes(m) ? ' selected' : ''}`} aria-pressed={modes.includes(m)} onClick={() => setModes(v => v.includes(m) ? v.filter(x => x !== m) : [...v, m])}>{cardLabel(lang, m)}</button>)}</div>
          {green && <p className="green-note"><Leaf size={16} weight="fill" aria-hidden="true" /> {L('Lộ trình này sẽ có nhãn Du lịch xanh (metro, xe buýt, đi bộ, xe đạp).', 'This route gets the Green travel label (metro, bus, walking, cycling).')}</p>}</fieldset>
        <fieldset><legend>{L('Điểm dừng theo thứ tự', 'Stops in order')}</legend>
          <ol className="stop-editor">{stops.map((s, i) => <li key={`${s.place_id}-${i}`}><strong>{name(s.place_id)}</strong><input maxLength={80} value={s.note} onChange={e => setStops(v => v.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} placeholder={L('Ghi chú (không bắt buộc)', 'Note (optional)')} aria-label={L('Ghi chú', 'Note')} /><span><button type="button" className="small-button" aria-label={L('Lên', 'Up')} onClick={() => move(i, -1)}><ArrowUp size={16} /></button><button type="button" className="small-button" aria-label={L('Xuống', 'Down')} onClick={() => move(i, 1)}><ArrowDown size={16} /></button><button type="button" className="small-button" aria-label={L('Bỏ', 'Remove')} onClick={() => setStops(v => v.filter((_, j) => j !== i))}><X size={16} /></button></span></li>)}</ol>
          <div className="stop-picker"><select value={pick} onChange={e => setPick(e.target.value)} aria-label={L('Chọn địa điểm', 'Choose a place')}><option value="">{L('Chọn địa điểm đã kiểm…', 'Choose a checked place…')}</option>{options.map(o => <option key={o.id} value={o.id}>{o.name} · {o.district}</option>)}</select><button type="button" className="small-button" disabled={!pick || stops.length >= 10} onClick={() => { setStops(v => [...v, { place_id: pick, note: '' }]); setPick(''); }}>{L('Thêm', 'Add')}</button></div>
        </fieldset>
        <button className="btn btn-primary" disabled={state === 'sending' || stops.length < 2 || modes.length === 0}>{L('Gửi lộ trình', 'Send route')}</button>
        {stops.length < 2 && <p className="caption">{L('Cần ít nhất 2 điểm dừng.', 'Add at least 2 stops.')}</p>}
        {state === 'error' && <p role="alert">{L('Chưa gửi được. Hãy thử lại.', 'Could not send. Please try again.')}</p>}
      </form>
    </Shell>
  );
}
