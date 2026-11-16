'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/pages/Shell';
import { useLanguage } from '@/lib/client/language';
import localPlaces from '@/lib/data/generated/dia_diem.json';
import type { DemandStats } from '@/lib/stats';

// What travellers ask, counted anonymously: question type, hour and suggested places.
// The partner filter is the report a tour company gets for its own chat box.
export default function Stats() {
  const { lang } = useLanguage();
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const [partner, setPartner] = useState('');
  const [loaded, setLoaded] = useState<{ partner: string; data: DemandStats } | null>(null);
  useEffect(() => { fetch(`/api/stats?days=7${partner ? `&partner=${partner}` : ''}`).then(r => r.json()).then(data => setLoaded({ partner, data })).catch(() => {}); }, [partner]);
  const stats = loaded?.partner === partner ? loaded.data : null;
  const topicNames: Record<string, string> = { places: L('Tìm địa điểm', 'Finding places'), price: L('Hỏi giá', 'Price checks'), plan: L('Lên lịch', 'Day plans'), tiktok: 'TikTok', menu: L('Dịch thực đơn', 'Menu translation'), routes: L('Lộ trình', 'Routes'), story: L('Câu chuyện địa điểm', 'Place stories'), replan: L('Đổi lịch (mưa, trễ, nhóm)', 'Plan changes (rain, late, group)'), chat: L('Hỏi đáp khác', 'Other questions') };
  const placeName = (id: string) => { const p = localPlaces.find(x => x.id === id); return p ? (lang === 'vi' ? p.ten_vi : p.ten_en) : id; };
  const max = (values: number[]) => Math.max(1, ...values);
  const topics = stats ? Object.entries(stats.topics).sort((a, b) => b[1] - a[1]) : [];
  const places = stats ? Object.entries(stats.places).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];
  return (
    <Shell title={L('Du khách hỏi gì', 'What travellers ask')} lead={L('Số liệu thật, ẩn danh, 7 ngày gần nhất. Chỉ đếm loại câu hỏi, giờ hỏi và địa điểm được gợi ý; không lưu nội dung câu hỏi, IP hay danh tính.', 'Real, anonymous numbers for the last 7 days. Only the question type, the hour and the suggested places are counted; no question text, IP or identity is stored.')}>
      <div className="card-actions mb-6" role="group" aria-label={L('Kênh', 'Channel')}>
        <button className={`small-button${partner === '' ? ' selected' : ''}`} aria-pressed={partner === ''} onClick={() => setPartner('')}>{L('Mọi kênh', 'All channels')}</button>
        <button className={`small-button${partner === 'tour-cua-ban' ? ' selected' : ''}`} aria-pressed={partner === 'tour-cua-ban'} onClick={() => setPartner('tour-cua-ban')}>{L('Khung chat “Tour Của Bạn”', '“Tour Của Bạn” chat box')}</button>
      </div>
      {!stats ? <p>{L('Đang tải…', 'Loading…')}</p> : <div className="stats-grid">
        <section className="result-card"><div className="card-kicker">{L('TỔNG LƯỢT HỎI', 'TOTAL QUESTIONS')}</div><p className="stat-big">{stats.total.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</p>
          <div className="stat-bars days">{stats.days.map(d => <div key={d}><i style={{ height: `${(stats.perDay[d] / max(Object.values(stats.perDay))) * 100}%` }} /><span>{d.slice(8)}/{d.slice(5, 7)}</span></div>)}</div></section>
        <section className="result-card"><div className="card-kicker">{L('HỎI VỀ GÌ', 'TOPICS')}</div>
          {topics.length === 0 ? <p>{L('Chưa có lượt hỏi nào.', 'No questions yet.')}</p> : <ul className="stat-list">{topics.map(([k, v]) => <li key={k}><span>{topicNames[k] ?? k}</span><i style={{ width: `${(v / max(topics.map(t => t[1]))) * 100}%` }} /><b>{v}</b></li>)}</ul>}</section>
        <section className="result-card"><div className="card-kicker">{L('GIỜ HỎI (GIỜ VIỆT NAM)', 'HOUR ASKED (VIETNAM TIME)')}</div>
          <div className="stat-bars hours">{stats.hours.map((v, h) => <div key={h} title={`${h}:00 · ${v}`}><i style={{ height: `${(v / max(stats.hours)) * 100}%` }} />{h % 6 === 0 && <span>{h}h</span>}</div>)}</div></section>
        <section className="result-card"><div className="card-kicker">{L('ĐỊA ĐIỂM ĐƯỢC GỢI Ý NHIỀU NHẤT', 'MOST SUGGESTED PLACES')}</div>
          {places.length === 0 ? <p>{L('Chưa có dữ liệu.', 'No data yet.')}</p> : <ul className="stat-list">{places.map(([id, v]) => <li key={id}><span>{placeName(id)}</span><i style={{ width: `${(v / max(places.map(p => p[1]))) * 100}%` }} /><b>{v}</b></li>)}</ul>}</section>
      </div>}
      <p className="caption mt-8">{L('Bắt đầu đếm từ ngày 17/11/2026. Đây là bảng mà Sở Du lịch và doanh nghiệp có khung chat riêng sẽ nhận.', 'Counting started on 17 Nov 2026. This is the report the tourism department and partners with their own chat box receive.')}</p>
    </Shell>
  );
}
