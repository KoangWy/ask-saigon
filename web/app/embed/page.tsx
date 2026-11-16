import type { Metadata } from 'next';
import ChatApp from '@/components/chat/ChatApp';
export const metadata: Metadata = { title: 'Ask Saigon assistant', robots: { index: false } };
// The chat box a tour company or hotel places on its own website with one script tag (public/widget.js).
export default async function Embed({ searchParams }: PageProps<'/embed'>) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const id = one(q.partner).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const lang = one(q.lang);
  return <ChatApp embed partner={{ id: id || undefined, name: one(q.name).slice(0, 60) || undefined, lang: lang === 'vi' || lang === 'en' ? lang : undefined }} />;
}
