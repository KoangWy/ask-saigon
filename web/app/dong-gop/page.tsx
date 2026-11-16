'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bank, PersonSimpleHike, Storefront } from '@phosphor-icons/react';
import Shell from '@/components/pages/Shell';
import { useLanguage } from '@/lib/client/language';
import localPlaces from '@/lib/data/generated/dia_diem.json';

type Role = 'chinh_thuc' | 'doanh_nghiep' | 'ca_nhan';
type Field = 'hours' | 'price' | 'closed' | 'info';

// Who feeds information in. Each submission waits in the review queue; once approved it shows
// on the place card with the submitter's label and the date it was checked.
export default function Contribute() {
  const { lang } = useLanguage();
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const roles: { id: Role; icon: typeof Bank; who: string; title: string; desc: string; label: string }[] = [
    { id: 'chinh_thuc', icon: Bank, who: L('Sở Du lịch, cơ quan nhà nước', 'Tourism department, public bodies'), title: L('Nạp dữ liệu chính thức', 'Publish official data'), desc: L('Điểm đến, sự kiện, giờ mở cửa, quy định niêm yết giá.', 'Destinations, events, opening hours, price-listing rules.'), label: L('nhãn: chính thức', 'label: official') },
    { id: 'doanh_nghiep', icon: Storefront, who: L('Doanh nghiệp', 'Businesses'), title: L('Tự cập nhật thông tin của mình', 'Keep your own details current'), desc: L('Giờ mở cửa, giá, dịch vụ. Ask Saigon kiểm lại trước khi hiện.', 'Opening hours, prices, services. Ask Saigon checks before showing it.'), label: L('nhãn: doanh nghiệp tự khai', 'label: business-declared') },
    { id: 'ca_nhan', icon: PersonSimpleHike, who: L('Người đi thật', 'Travellers'), title: L('Chia sẻ chuyến đi của mình', 'Share your trip'), desc: L('Đăng lộ trình đã đi, chấm sao, báo khi thông tin đã cũ.', 'Post a route you took, rate routes, flag information that is out of date.'), label: L('nhãn: trải nghiệm cá nhân', 'label: personal experience') },
  ];
  const options = useMemo(() => localPlaces.filter(p => p.trang_thai === 'hoat_dong').map(p => ({ id: p.id, name: lang === 'vi' ? p.ten_vi : p.ten_en })).sort((a, b) => a.name.localeCompare(b.name, 'vi')), [lang]);
  const [role, setRole] = useState<Role>('doanh_nghiep');
  const [place, setPlace] = useState('');
  const [field, setField] = useState<Field>('hours');
  const [allDay, setAllDay] = useState(false);
  const [open, setOpen] = useState('07:00');
  const [close, setClose] = useState('22:00');
  const [value, setValue] = useState('');
  const [organization, setOrganization] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'error' | { id: string }>('idle');
  const fields: { id: Field; label: string }[] = [{ id: 'hours', label: L('Giờ mở cửa', 'Opening hours') }, { id: 'price', label: L('Giá', 'Price') }, { id: 'closed', label: L('Đã đóng cửa', 'Closed for good') }, { id: 'info', label: L('Thông tin khác', 'Other details') }];
  return (
    <Shell title={L('Cổng nạp thông tin', 'Contribution portal')} lead={L('Ask Saigon không tự sản xuất nội dung. Sở Du lịch, doanh nghiệp và người đi thật tự nạp phần của mình; nhóm kiểm lại rồi mới hiện trên thẻ, kèm nhãn của bên đã nạp và ngày kiểm.', 'Ask Saigon does not write its own content. The tourism department, businesses and travellers each add their part; the team checks it before it appears on a card, with the label of whoever supplied it and the date it was checked.')}>
      <div className="role-cards" role="radiogroup" aria-label={L('Bạn là ai?', 'Who are you?')}>
        {roles.map(r => { const Icon = r.icon; return (
          <button type="button" role="radio" aria-checked={role === r.id} key={r.id} className={`role-card${role === r.id ? ' selected' : ''}`} onClick={() => { setRole(r.id); setState('idle'); }}>
            <span className="role-icon"><Icon size={26} weight="duotone" aria-hidden="true" /></span><small>{r.who}</small><strong>{r.title}</strong><span>{r.desc}</span><em>{r.label}</em>
          </button>
        ); })}
      </div>
      {role === 'ca_nhan' && <div className="community-actions mt-6"><Link href="/lo-trinh/dang" className="btn btn-primary">{L('Đăng lộ trình', 'Post a route')}</Link><Link href="/lo-trinh" className="btn btn-ghost">{L('Chấm sao lộ trình', 'Rate routes')}</Link></div>}
      {typeof state === 'object' ? (
        <div className="result-card mt-8" role="status"><h3>{L('Đã nhận, đang chờ kiểm', 'Received, waiting for review')}</h3><p>{L(`Mã gửi: ${state.id}. Khi được duyệt, thông tin hiện trên thẻ địa điểm kèm nhãn và ngày kiểm.`, `Reference: ${state.id}. Once approved it appears on the place card with its label and checked date.`)}</p><button className="small-button" onClick={() => { setState('idle'); setValue(''); setNote(''); }}>{L('Gửi thêm', 'Send another')}</button></div>
      ) : (
        <form className="community-form mt-8" onSubmit={async e => {
          e.preventDefault(); setState('sending');
          const payload = { role, place_id: place, field, value: field === 'hours' ? (allDay ? 'daily 00:00-00:00' : `daily ${open}-${close}`) : field === 'closed' ? '' : value, note, organization, source_url: source };
          try { const r = await fetch('/api/contributions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); setState(r.ok ? { id: (await r.json()).id } : 'error'); } catch { setState('error'); }
        }}>
          <h2 className="text-[22px] font-semibold">{role === 'ca_nhan' ? L('Hoặc báo thông tin đã thay đổi', 'Or tell us something has changed') : roles.find(r => r.id === role)!.title}</h2>
          <label>{L('Địa điểm', 'Place')}<select required value={place} onChange={e => setPlace(e.target.value)}><option value="">{L('Chọn địa điểm…', 'Choose a place…')}</option>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          <fieldset><legend>{L('Loại thông tin', 'What changed')}</legend><div className="card-actions">{fields.map(f => <button type="button" key={f.id} className={`small-button${field === f.id ? ' selected' : ''}`} aria-pressed={field === f.id} onClick={() => setField(f.id)}>{f.label}</button>)}</div></fieldset>
          {field === 'hours' && <fieldset><legend>{L('Giờ mở cửa hằng ngày', 'Daily opening hours')}</legend><label className="inline-check"><input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} /> {L('Mở 24 giờ', 'Open 24 hours')}</label>{!allDay && <div className="time-row"><label>{L('Mở', 'Opens')}<input type="time" required value={open} onChange={e => setOpen(e.target.value)} /></label><label>{L('Đóng', 'Closes')}<input type="time" required value={close} onChange={e => setClose(e.target.value)} /></label></div>}</fieldset>}
          {(field === 'price' || field === 'info') && <label>{field === 'price' ? L('Giá (ví dụ: 55.000–75.000 đ một tô)', 'Price (e.g. 55,000–75,000 VND a bowl)') : L('Thông tin', 'Details')}<input required maxLength={200} value={value} onChange={e => setValue(e.target.value)} /></label>}
          {role !== 'ca_nhan' && <label>{role === 'chinh_thuc' ? L('Đơn vị', 'Organisation') : L('Tên doanh nghiệp', 'Business name')}<input required maxLength={120} value={organization} onChange={e => setOrganization(e.target.value)} /></label>}
          <label>{L('Link nguồn', 'Source link')}{role === 'chinh_thuc' ? '' : L(' (không bắt buộc)', ' (optional)')}<input type="url" required={role === 'chinh_thuc'} maxLength={300} value={source} onChange={e => setSource(e.target.value)} placeholder="https://" /></label>
          <label>{L('Ghi chú cho người kiểm', 'Note for the reviewer')}<textarea maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
          <button className="btn btn-primary" disabled={state === 'sending'}>{L('Gửi để kiểm duyệt', 'Send for review')}</button>
          {state === 'error' && <p role="alert">{L('Chưa gửi được. Kiểm tra lại thông tin rồi thử lại.', 'Could not send. Check the details and try again.')}</p>}
          <p className="caption">{L('Không cần đăng nhập ở bản đầu. Mọi thông tin đều qua kiểm duyệt; trên kênh của thành phố, Sở Du lịch duyệt nguồn và có quyền gỡ nội dung.', 'No sign-in in this first version. Everything goes through review; on the city channel, the tourism department approves sources and can remove content.')}</p>
        </form>
      )}
    </Shell>
  );
}
