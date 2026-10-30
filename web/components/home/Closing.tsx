'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { forward } from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';
import { photo, photoAlt } from '@/lib/photos';

export default function Closing() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  const p = photo('district1-aerial');

  return (
    <section ref={ref} className="closing on-photo">
      <motion.div className="closing-media" style={reduce ? undefined : { scale }}>
        <Image src={p.file} alt={photoAlt(p, lang)} fill sizes="100vw" />
      </motion.div>
      <div className="closing-scrim" />
      <div className="wrap flex min-h-[80dvh] flex-col justify-end py-20 md:py-28">
        <Reveal>
          <h2 className="display m-0 text-[clamp(48px,8vw,112px)] leading-[0.95] font-extrabold">{tr('Your Saigon story')}<br /><span className="text-sun">{tr('starts here.')}</span></h2>
        </Reveal>
        <Reveal delay={0.15} className="mt-10">
          <Link href="/chat" transitionTypes={forward} className="btn btn-sun">{tr('Try it for yourself')} <ArrowUpRight className="btn-arrow" size={18} weight="bold" aria-hidden="true" /></Link>
        </Reveal>
      </div>
    </section>
  );
}
