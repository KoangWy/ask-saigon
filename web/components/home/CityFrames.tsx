'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { forward } from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import { useLanguage } from '@/lib/client/language';
import { useMediaQuery } from '@/lib/client/media';
import places from '@/lib/data/generated/dia_diem.json';
import { pageText, type Lang } from '@/lib/i18n';
import { photo, photoAlt } from '@/lib/photos';

// Each frame opens the chat about that landmark: its verified story when the dataset has one, otherwise a question.
const columns = [
  [{ slug: 'notre-dame-cathedral', place: 'q1-006', ratio: 'aspect-[3/4]' }, { slug: 'opera-house', place: 'q1-007', ratio: 'aspect-[4/3]' }],
  [{ slug: 'ben-thanh-market', place: 'q1-001', ratio: 'aspect-[4/3]' }, { slug: 'tan-dinh-church', place: 'q3-003', ratio: 'aspect-[3/4]' }, { slug: 'rex-continental-dusk', place: 'q1-013', ratio: 'aspect-[4/3]' }],
  [{ slug: 'city-hall-night', place: 'q1-010', ratio: 'aspect-[4/3]' }, { slug: 'central-post-office', place: 'q1-005', ratio: 'aspect-square' }, { slug: 'nguyen-hue-night', place: 'q1-002', ratio: 'aspect-[4/3]' }],
];

function Frame({ slug, place, ratio, lang }: { slug: string; place: string; ratio: string; lang: Lang }) {
  const tr = (text: string) => pageText(lang, text);
  const p = photo(slug);
  const info = places.find(item => item.id === place)!;
  const name = lang === 'vi' ? info.ten_vi : info.ten_en;
  const question = lang === 'vi' ? `Kể cho tôi về ${name}. Gần đó có gì?` : `Tell me about ${name}. What is nearby?`;
  const href = info.cau_chuyen_en ? `/chat?story=${place}` : `/chat?q=${encodeURIComponent(question)}`;
  return (
    <Link href={href} transitionTypes={forward} className="frame-link block" aria-label={`${tr('Ask about')} ${name}`}>
      <div className={`photo-frame photo-frame-hover ${ratio}`}>
        <Image src={p.file} alt={photoAlt(p, lang)} fill sizes="(min-width: 1024px) 400px, 50vw" />
      </div>
      <div className="frame-caption">
        <span>{name}<small>{tr(info.khu === 'Q3' ? 'District 3' : 'District 1')}</small></span>
        <span className="frame-ask"><ArrowUpRight size={18} aria-hidden="true" /></span>
      </div>
    </Link>
  );
}

function Column({ items, y, lang, offset }: { items: (typeof columns)[number]; y?: MotionValue<number>; lang: Lang; offset?: string }) {
  return (
    <motion.div className={`contents lg:grid lg:content-start lg:gap-10 ${offset ?? ''}`} style={y ? { y } : undefined}>
      {items.map(item => <Frame key={item.slug} {...item} lang={lang} />)}
    </motion.div>
  );
}

export default function CityFrames() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const reduce = useReducedMotion();
  const wide = useMediaQuery('(min-width: 1024px)');
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const slow = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const fast = useTransform(scrollYProgress, [0, 1], [90, -90]);
  const parallax = wide && !reduce;

  return (
    <section className="section lg:pb-12">
      <div className="wrap">
        <Reveal className="max-w-[640px]">
          <h2 className="section-title">{tr('Start from')} <span className="em">{tr('where you stand.')}</span></h2>
          <p className="section-lead">{tr('Pick a landmark in District 1 or 3 to hear its story and see what is nearby.')}</p>
        </Reveal>
        <div ref={ref} className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          <Column items={columns[0]} y={parallax ? slow : undefined} lang={lang} />
          <Column items={columns[1]} y={parallax ? fast : undefined} lang={lang} offset="lg:pt-24" />
          <Column items={columns[2]} y={parallax ? slow : undefined} lang={lang} />
        </div>
      </div>
    </section>
  );
}
