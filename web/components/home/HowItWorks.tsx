'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ChatCircleText, MapTrifold, SealCheck } from '@phosphor-icons/react';
import Reveal from '@/components/motion/Reveal';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';
import { photo, photoAlt } from '@/lib/photos';

const steps = [
  { icon: ChatCircleText, title: 'Ask your question', body: 'Tell us what you’re curious about.' },
  { icon: SealCheck, title: 'Get local context', body: 'See useful cards, sources, and practical details.' },
  { icon: MapTrifold, title: 'Make the day yours', body: 'Save a plan or head out on your own terms.' },
];
const river = 'M20 0C36 70 4 140 20 210S36 350 20 420 4 560 20 630';

export default function HowItWorks() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const p = photo('cafe-apartment');

  return (
    <section id="how" className="section">
      <div className="wrap grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+40px)] lg:self-start">
          <Reveal>
            <span className="eyebrow">{tr('HOW IT WORKS')}</span>
            <h2 className="section-title">{tr('Three little steps.')} <span className="em">{tr('A whole city.')}</span></h2>
          </Reveal>
          <Reveal delay={0.1} className="photo-frame mt-8 hidden aspect-[4/5] max-w-[420px] lg:block">
            <Image src={p.file} alt={photoAlt(p, lang)} fill sizes="420px" />
          </Reveal>
        </div>
        <ol ref={ref} className="relative m-0 grid gap-16 p-0 pl-16 md:gap-28 md:pl-24" style={{ listStyle: 'none' }}>
          <svg className="river-progress" viewBox="0 0 40 630" preserveAspectRatio="none" aria-hidden="true">
            <path d={river} fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <motion.path d={river} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: reduce ? 1 : drawn }} />
          </svg>
          {steps.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={0.05 * i}>
              <span className="mb-6 grid size-14 place-items-center rounded-full bg-accent-soft text-accent-text"><Icon size={28} aria-hidden="true" /></span>
              <h3 className="display text-[clamp(30px,3.6vw,48px)] leading-[1.02]">{tr(title)}</h3>
              <p className="mt-3 max-w-[38ch] text-[17px] text-ink-soft">{tr(body)}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
