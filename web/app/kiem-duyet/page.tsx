'use client';
import { useCallback, useState } from 'react';
import Shell from '@/components/pages/Shell';
import { useLanguage } from '@/lib/client/language';
import { cardLabel } from '@/lib/i18n';
import type { Submission } from '@/lib/contributions';
import type { StoredRoute } from '@/lib/routes';

// Review queue for the team: nothing submitted reaches a card or the route feed before approval.
export default function Review() {
  const { lang } = useLanguage();
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const [key, setKey] = useState('');
  const [data, setData] = useState<{ submissions: Submission[]; routes: StoredRoute[] } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async (k: string) => {
    const r = await fetch('/api/review', { headers: { 'x-review-key': k } });
    if (!r.ok) { setError(L('Sai mã kiểm duyệt.', 'Wrong review key.')); setData(null); return; }
    setError(''); setData(await r.json());
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const decide = async (type: 'submission' | 'route', id: string, status: 'approved' | 'rejected') => { await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-review-key': key }, body: JSON.stringify({ type, id, status }) }); await load(key); };
  const pending = data?.submissions.filter(s => s.status === 'pending') ?? [];
  const done = data?.submissions.filter(s => s.status !== 'pending') ?? [];
  const routes = data?.routes.filter(r => r.status === 'pending' && r.owner !== 'rejected') ?? [];
  const status = (s: Submission['status']) => s === 'approved' ? L('đã duyệt', 'approved') : s === 'rejected' ? L('từ chối', 'rejected') : L('chờ kiểm', 'pending');
  return (
    <Shell title={L('Kiểm duyệt', 'Review')} lead={L('Thông tin do Sở, doanh nghiệp, du khách gửi và lộ trình mới chỉ hiện sau khi được duyệt ở đây.', 'Information from the department, businesses and travellers, and new routes, only appear once approved here.')}>
      {!data && <form className="community-form" onSubmit={e => { e.preventDefault(); void load(key); }}><label>{L('Mã kiểm duyệt', 'Review key')}<input type="password" required value={key} onChange={e => setKey(e.target.value)} autoComplete="current-password" /></label><button className="btn btn-primary">{L('Mở hàng chờ', 'Open the queue')}</button>{error && <p role="alert">{error}</p>}</form>}
      {data && <div className="review-grid">
        <section><h2>{L('Thông tin chờ kiểm', 'Waiting for review')} ({pending.length})</h2>
          {pending.length === 0 && <p className="caption">{L('Không có gì đang chờ.', 'Nothing waiting.')}</p>}
          {pending.map(s => <article key={s.id} className="result-card"><div className="card-kicker">{s.kind === 'report' ? L('BÁO SAI', 'REPORT') : L('CẬP NHẬT', 'UPDATE')} · {cardLabel(lang, s.role)}</div><h3>{s.name}</h3><p><strong>{s.field}</strong>{s.value ? `: ${s.value}` : ''}{s.note ? ` · “${s.note}”` : ''}</p><p className="caption">{s.organization ? `${s.organization} · ` : ''}{s.source_url ? <a href={s.source_url} target="_blank" rel="noreferrer">{s.source_url}</a> : null} {new Date(s.created_at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}</p><div className="card-actions"><button className="small-button primary" onClick={() => decide('submission', s.id, 'approved')}>{L('Duyệt', 'Approve')}</button><button className="small-button" onClick={() => decide('submission', s.id, 'rejected')}>{L('Từ chối', 'Reject')}</button></div></article>)}
        </section>
        <section><h2>{L('Lộ trình mới', 'New routes')} ({routes.length})</h2>
          {routes.length === 0 && <p className="caption">{L('Không có lộ trình mới.', 'No new routes.')}</p>}
          {routes.map(r => <article key={r.id} className="result-card"><div className="card-kicker">{L('LỘ TRÌNH', 'ROUTE')} · {r.author}</div><h3>{r.title}</h3><p>{r.summary}</p><p className="caption">{r.stops.length} {L('điểm dừng', 'stops')} · {r.modes.join(', ')}</p><div className="card-actions"><button className="small-button primary" onClick={() => decide('route', r.id, 'approved')}>{L('Duyệt', 'Approve')}</button><button className="small-button" onClick={() => decide('route', r.id, 'rejected')}>{L('Từ chối', 'Reject')}</button></div></article>)}
          <h2 className="mt-10">{L('Đã xử lý', 'Handled')}</h2>
          {done.slice(0, 20).map(s => <p key={s.id} className="caption">{s.name} · {s.field} · {status(s.status)}</p>)}
        </section>
      </div>}
    </Shell>
  );
}
