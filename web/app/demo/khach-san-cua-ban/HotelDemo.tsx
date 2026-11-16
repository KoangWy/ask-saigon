'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Bed, Coffee, Television, WifiHigh } from '@phosphor-icons/react';

// A made-up hotel's guest web app (the page a guest opens from the room, or on the room TV).
// The assistant is the same /embed chat box, in the guest's language and under the hotel's name.
export default function HotelDemo() {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [tv, setTv] = useState(false);
  const vi = lang === 'vi';
  const src = `/embed?${new URLSearchParams({ partner: 'khach-san-cua-ban', name: 'Khách Sạn Của Bạn', lang })}`;
  return (
    <div className={`hotel-demo${tv ? ' tv' : ''}`}>
      <p className="tour-demo-note">Trang minh họa web app của một khách sạn giả định: trợ lý Ask Saigon chạy trong ứng dụng khách mở trong phòng hoặc trên TV. <Link href="/business#embed">Xem mã nhúng</Link></p>
      <div className="hotel-layout">
        <aside>
          <b className="hotel-name">Khách Sạn Của Bạn</b>
          <small>{vi ? 'Phòng 1203 · Chào mừng quý khách' : 'Room 1203 · Welcome'}</small>
          <ul>
            <li><Bed size={20} aria-hidden="true" /> {vi ? 'Dọn phòng' : 'Housekeeping'}</li>
            <li><Coffee size={20} aria-hidden="true" /> {vi ? 'Bữa sáng' : 'Breakfast'}</li>
            <li><WifiHigh size={20} aria-hidden="true" /> Wi-Fi</li>
          </ul>
          <div className="hotel-controls">
            <span>{vi ? 'Ngôn ngữ của khách' : 'Guest language'}</span>
            <div role="group" aria-label={vi ? 'Ngôn ngữ của khách' : 'Guest language'}>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
              <button type="button" aria-pressed={lang === 'vi'} onClick={() => setLang('vi')}>Tiếng Việt</button>
            </div>
            <button type="button" className="tv-toggle" aria-pressed={tv} onClick={() => setTv(!tv)}><Television size={18} aria-hidden="true" /> {vi ? 'Chế độ TV' : 'TV mode'}</button>
          </div>
        </aside>
        <iframe key={lang} title={vi ? 'Trợ lý Khách Sạn Của Bạn' : 'Khách Sạn Của Bạn assistant'} src={src} allow="geolocation" />
      </div>
    </div>
  );
}
