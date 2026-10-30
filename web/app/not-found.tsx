'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react';
import { back } from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import SiteHeader from '@/components/site/SiteHeader';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';
import { photoAlt, photoOr } from '@/lib/photos';

export default function NotFound() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const p = photoOr('hem-alley');
  return (
    <>
      <SiteHeader overlay />
      <main className="closing on-photo">
        <div className="closing-media"><Image src={p.file} alt={photoAlt(p, lang)} fill priority sizes="100vw" /></div>
        <div className="closing-scrim" />
        <div className="wrap flex min-h-[100dvh] flex-col justify-end pb-20 pt-32">
          <Reveal>
            <span className="eyebrow text-sun">{tr('OFF THE MAP')}</span>
            <h1 className="display m-0 text-[clamp(44px,7vw,96px)] leading-[0.98] font-extrabold">{tr('This street ends here.')}</h1>
            <p className="mt-5 text-[18px] text-cream/85">{tr('Let’s find our way back.')}</p>
          </Reveal>
          <Reveal delay={0.12} className="mt-6">
            <Link className="btn btn-sun" href="/" transitionTypes={back}>{tr('Back home')} <ArrowUpRight className="btn-arrow" size={18} weight="bold" aria-hidden="true" /></Link>
          </Reveal>
        </div>
      </main>
    </>
  );
}
