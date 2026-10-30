'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowUp, Play } from '@phosphor-icons/react';
import { easeOut } from '@/components/motion/Reveal';
import { forward } from '@/components/motion/PageTransition';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';
import { photo, photoAlt } from '@/lib/photos';

export const starters = [
  { sample: 'price-cyclo', label: 'Is 300k for a cyclo fair?' },
  { sample: 'menu-1', label: 'Translate a menu' },
  { sample: 'plan-d1-night', label: 'Plan my night in District 1' },
  { sample: 'tiktok-found', label: 'Check a TikTok spot' },
];

export default function Hero() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const router = useRouter();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [question, setQuestion] = useState('');
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const skyline = photo('skyline-river');
  const rise = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: easeOut } });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = question.trim();
    if (text) router.push(`/chat?q=${encodeURIComponent(text)}`, { transitionTypes: forward });
  };

  return (
    <section ref={ref} className="hero on-photo">
      <motion.div className="hero-media" style={reduce ? undefined : { y: mediaY, scale: mediaScale }}>
        <motion.div className="absolute inset-0" initial={reduce ? false : { scale: 1.14 }} animate={{ scale: 1 }} transition={{ duration: 2.6, ease: easeOut }}>
          <Image src={skyline.file} alt={photoAlt(skyline, lang)} fill priority sizes="100vw" />
        </motion.div>
      </motion.div>
      <div className="hero-scrim" />
      <motion.div className="wrap relative pb-14 pt-32 md:pb-20" style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}>
        <div className="max-w-[760px]">
          <h1>
            <span className="block overflow-hidden pb-1"><motion.span className="block" {...(reduce ? {} : { initial: { y: '105%' }, animate: { y: 0 }, transition: { duration: 1, delay: 0.15, ease: easeOut } })}>{tr('A better way to')}</motion.span></span>
            <span className="block overflow-hidden pb-2"><motion.span className="hero-em block" {...(reduce ? {} : { initial: { y: '105%' }, animate: { y: 0 }, transition: { duration: 1, delay: 0.28, ease: easeOut } })}>{tr('meet Saigon.')}</motion.span></span>
          </h1>
          <motion.p className="hero-sub" {...rise(0.45)}>{tr('Ask anything. Find your way through Ho Chi Minh City with local knowledge you can trace.')}</motion.p>
          <motion.form className="ask-box max-w-[640px]" style={{ viewTransitionName: 'composer' }} onSubmit={submit} {...rise(0.6)}>
            <label htmlFor="hero-question" className="sr-only">{tr('Your question')}</label>
            <input id="hero-question" type="text" maxLength={500} autoComplete="off" value={question} onChange={e => setQuestion(e.target.value)} placeholder={tr('Ask about food, prices, places, a whole day…')} />
            <button className="ask-send" type="submit" disabled={!question.trim()}>
              <span className="hidden sm:inline">{tr('Ask')}</span>
              <ArrowUp size={18} weight="bold" aria-hidden="true" />
              <span className="sr-only sm:hidden">{tr('Ask')}</span>
            </button>
          </motion.form>
          <motion.div {...rise(0.75)}>
            <p className="sr-only">{tr('Or start with an example')}</p>
            <ul className="mt-4 flex max-w-[680px] flex-wrap gap-2 p-0" style={{ listStyle: 'none' }}>
              {starters.map(s => (
                <li key={s.sample}><Link className="chip chip-glass" href={`/chat?sample=${s.sample}`} transitionTypes={forward}>{tr(s.label)}</Link></li>
              ))}
            </ul>
          </motion.div>
          <motion.div className="mt-8" {...rise(0.9)}>
            <a className="btn btn-glass" href="/demo/ask-saigon-demo.mp4">
              <Play size={16} weight="fill" aria-hidden="true" /> {tr('Watch the demo (~100 s)')}
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
