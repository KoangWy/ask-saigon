import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { photo } from '@/lib/photos';

export const metadata: Metadata = { title: 'Tour Của Bạn (demo partner site)', robots: { index: false } };

// A made-up tour company's website. It adds Ask Saigon exactly as a real partner would:
// one <script> tag that loads /widget.js, which opens the chat box from /embed.
const tours = [
  { slug: 'ben-thanh-market', title: 'Chợ và ẩm thực Quận 1', meta: 'Nửa ngày · đi bộ' },
  { slug: 'central-post-office', title: 'Sài Gòn xưa', meta: 'Nửa ngày · đi bộ' },
  { slug: 'nguyen-hue-night', title: 'Sài Gòn về đêm', meta: 'Buổi tối · đi bộ' },
];
export default function TourDemo() {
  const hero = photo('skyline-river');
  return (
    <div className="tour-demo">
      <p className="tour-demo-note">Trang minh họa của một công ty tour giả định, dùng để thử khung chat Ask Saigon nhúng bằng một dòng mã. <Link href="/business#embed">Xem mã nhúng</Link></p>
      <nav className="tour-demo-nav"><b>Tour Của Bạn</b><span>Tour trong ngày</span><span>Tour tự túc</span><span>Liên hệ</span><em>Đặt tour</em></nav>
      <header className="tour-demo-hero">
        <Image src={hero.file} alt="" fill priority sizes="100vw" />
        <div><small>TOUR TỰ TÚC CÓ HƯỚNG DẪN</small><h1>Sài Gòn trong một ngày</h1><em>Xem lịch trình</em></div>
      </header>
      <section className="tour-demo-cards">
        {tours.map(t => { const p = photo(t.slug); return (
          <article key={t.slug}><div><Image src={p.file} alt="" fill sizes="(min-width: 760px) 30vw, 100vw" /></div><b>{t.title}</b><span>{t.meta}</span></article>
        ); })}
      </section>
      <script src="/widget.js" data-partner="tour-cua-ban" data-name="Tour Của Bạn" data-lang="vi" data-color="#b85f40" data-open="true" async />
    </div>
  );
}
