'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Shell from '@/components/pages/Shell';
import { RouteCard } from '@/components/cards/CardRenderer';
import { clientId } from '@/lib/client/id';
import { useLanguage } from '@/lib/client/language';
import type { Route } from '@/lib/schema';

export default function RouteDetail({ id }: { id: string }) {
  const { lang } = useLanguage();
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const router = useRouter();
  const [route, setRoute] = useState<Route | null | undefined>();
  useEffect(() => { fetch(`/api/routes?lang=${lang}&client=${clientId()}`).then(r => r.json()).then(d => setRoute((d.routes as Route[]).find(r => r.id === id) ?? null)).catch(() => setRoute(null)); }, [id, lang]);
  return (
    <Shell title={route?.title ?? L('Lộ trình', 'Route')}>
      {route === undefined ? <p>{L('Đang tải…', 'Loading…')}</p> : route === null ? <p>{L('Không tìm thấy lộ trình này.', 'This route could not be found.')}</p> : <div className="route-feed"><RouteCard route={route} lang={lang} send={input => { if (input.kind === 'follow_route') router.push(`/chat?route=${input.route_id}`); }} /></div>}
      <p className="mt-6"><Link href="/lo-trinh" className="btn btn-ghost btn-sm">← {L('Tất cả lộ trình', 'All routes')}</Link></p>
    </Shell>
  );
}
