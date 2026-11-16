'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import Shell from '@/components/pages/Shell';
import { RouteCard } from '@/components/cards/CardRenderer';
import { clientId } from '@/lib/client/id';
import { useLanguage } from '@/lib/client/language';
import type { Route } from '@/lib/schema';

export default function Routes() {
  const { lang } = useLanguage();
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[] | null>(null);
  useEffect(() => { fetch(`/api/routes?lang=${lang}&client=${clientId()}`).then(r => r.json()).then(d => setRoutes(d.routes)).catch(() => setRoutes([])); }, [lang]);
  return (
    <Shell title={L('Lộ trình', 'Routes')} lead={L('Ai cũng đăng được chuyến đi của mình. Mỗi điểm dừng là một địa điểm đã kiểm nguồn. Đi xong, du khách chấm sao; lộ trình nhiều người đi và chấm cao sẽ nổi lên.', 'Anyone can post a trip they took. Every stop is a place with a checked source. Travellers rate a route after walking it; well-rated routes rise to the top.')}>
      <div className="community-actions"><Link href="/lo-trinh/dang" className="btn btn-primary"><Plus size={18} weight="bold" aria-hidden="true" /> {L('Đăng lộ trình', 'Post a route')}</Link><Link href="/chat" className="btn btn-ghost">{L('Hỏi trợ lý', 'Ask the assistant')}</Link></div>
      <div className="route-feed" aria-busy={routes === null}>
        {routes === null ? <p>{L('Đang tải…', 'Loading…')}</p> : routes.map(r => <RouteCard key={r.id} route={r} lang={lang} send={input => { if (input.kind === 'follow_route') router.push(`/chat?route=${input.route_id}`); }} />)}
      </div>
      <p className="caption mt-8">{L('Ba lộ trình đầu do nhóm Ask Saigon đăng. Lộ trình mới được kiểm trước khi hiện cho mọi người; người đăng thấy bài của mình ngay, kèm nhãn “Đang chờ kiểm duyệt”. Số sao là lượt chấm thật.', 'The first three routes were posted by the Ask Saigon team. New routes are reviewed before everyone sees them; the author sees theirs right away, marked “Waiting for review”. Ratings are real.')}</p>
    </Shell>
  );
}
