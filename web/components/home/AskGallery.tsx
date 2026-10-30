'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { forward } from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import { useLanguage } from '@/lib/client/language';
import { useMediaQuery } from '@/lib/client/media';
import { pageText, type Lang } from '@/lib/i18n';
import { photoAlt, photoOr } from '@/lib/photos';

const cases = [
  { href: '/chat?sample=tiktok-found', photo: ['night-market'], title: 'Saw it on TikTok?', body: 'Paste the link. Ask Saigon finds the place, checks whether it is still open and shows the way.' },
  { href: '/chat?sample=menu-1', photo: ['pho-bowl'], title: 'Can’t read the menu?', body: 'Snap a photo. Each dish is explained, with what is inside and how to order it out loud.' },
  { href: '/chat?sample=price-cyclo', photo: ['cyclo'], title: 'Is this price fair?', body: 'Compare a quote with checked local reference prices before you agree.' },
  { href: '/chat?sample=plan-d1-night', photo: ['ba-son-bridge-night'], title: 'Plan my evening', body: 'A walkable route with times, costs and a budget you set.' },
  { href: '/chat?story=q1-005', photo: ['central-post-office'], title: 'What’s the story here?', body: 'Short local stories for the landmark in front of you, ready to listen to.' },
];

function Card({ item, lang, priority }: { item: (typeof cases)[number]; lang: Lang; priority?: boolean }) {
  const tr = (text: string) => pageText(lang, text);
  const p = photoOr(...item.photo);
  return (
    <Link href={item.href} transitionTypes={forward} className="usecase-card group">
      <div className="photo-frame photo-frame-hover aspect-[4/5]">
        <Image src={p.file} alt={photoAlt(p, lang)} fill sizes="(min-width: 1024px) 400px, 80vw" priority={priority} />
      </div>
      <div className="grid gap-2">
        <h3>{tr(item.title)}</h3>
        <p>{tr(item.body)}</p>
        <span className="usecase-link mt-1">{tr('Ask this')} <ArrowRight size={16} weight="bold" aria-hidden="true" /></span>
      </div>
    </Link>
  );
}

function Heading({ lang }: { lang: Lang }) {
  const tr = (text: string) => pageText(lang, text);
  return (
    <div className="max-w-[440px]">
      <span className="eyebrow">{tr('What you can ask')}</span>
      <h2 className="section-title">{tr('Less guessing.')} <span className="em">{tr('More going.')}</span></h2>
      <p className="section-lead">{tr('A little local context goes a long way. Start with a question and make the day your own.')}</p>
    </div>
  );
}

// Desktop: the section pins and vertical scroll pans the cards sideways. Mobile and reduced motion: a swipeable row.
export default function AskGallery() {
  const { lang } = useLanguage();
  const reduce = useReducedMotion();
  const wide = useMediaQuery('(min-width: 1024px)');
  const pinned = wide && !reduce;
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [0, -distance]), { stiffness: 120, damping: 30, mass: 0.4 });

  useLayoutEffect(() => {
    if (!pinned || !track.current) return;
    const el = track.current;
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [pinned]);

  if (!pinned) {
    return (
      <section id="ask" ref={section} className="section">
        <div className="wrap"><Reveal><Heading lang={lang} /></Reveal></div>
        <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none]">
          {cases.map(item => (
            <div key={item.href} className="w-[78vw] max-w-[360px] flex-none snap-start"><Card item={item} lang={lang} /></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="ask" ref={section} className="relative" style={{ height: `calc(100dvh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <motion.div ref={track} className="flex items-center gap-8 pl-[max(var(--gutter),calc((100vw-1280px)/2))] pr-[12vw]" style={{ x }}>
          <div className="w-[420px] flex-none pr-6"><Heading lang={lang} /></div>
          {cases.map((item, i) => (
            <div key={item.href} className="w-[min(26vw,360px,calc((100dvh-280px)*0.8))] flex-none" style={{ marginTop: i % 2 ? 64 : 0 }}><Card item={item} lang={lang} priority={i < 2} /></div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
