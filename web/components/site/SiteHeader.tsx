'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { ArrowUpRight, ChatCircleDots, List, X } from '@phosphor-icons/react';
import Logo from '@/components/brand/Logo';
import LanguageToggle from '@/components/site/LanguageToggle';
import { transitionFor } from '@/components/motion/PageTransition';
import { easeOut } from '@/components/motion/Reveal';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';

export const navItems = [
  { href: '/#ask', label: 'What you can ask' },
  { href: '/#how', label: 'How it works' },
  { href: '/business', label: 'For business' },
];

// overlay: the header floats over a full-bleed photo until the page scrolls.
export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(!overlay);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, 'change', y => setSolid(!overlay || y > 40));
  useEffect(() => { const frame = requestAnimationFrame(() => setSolid(!overlay || window.scrollY > 40)); return () => cancelAnimationFrame(frame); }, [overlay]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = ''; };
  }, [open]);
  const onPhoto = overlay && !solid && !open;

  return (
    <>
      <header className={`site-header ${onPhoto ? 'on-photo' : ''}`} data-overlay={overlay} data-solid={solid && !open}>
        <div className="wrap site-header-inner">
          <Link href="/" transitionTypes={transitionFor('/')} aria-label={tr('Home')} onClick={() => setOpen(false)}>
            <Logo size={32} />
          </Link>
          <nav className="site-nav" aria-label={tr('Main')}>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} transitionTypes={transitionFor(item.href)} aria-current={pathname === item.href ? 'page' : undefined}>{tr(item.label)}</Link>
            ))}
          </nav>
          <LanguageToggle />
          <Link href="/chat" transitionTypes={transitionFor('/chat')} className={`btn btn-sm ${onPhoto ? 'btn-sun' : 'btn-primary'}`} aria-label={tr('Try it for yourself')}>
            <ChatCircleDots size={18} weight="fill" aria-hidden="true" />
            <span className="header-cta-label-long">{tr('Try it for yourself')}</span>
            <span className="header-cta-label-short">{tr('Try it')}</span>
          </Link>
          <button type="button" className="menu-button" aria-expanded={open} aria-label={tr(open ? 'Close menu' : 'Open menu')} onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu" initial={reduce ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: easeOut }}>
            {[...navItems, { href: '/demo/ask-saigon-demo.mp4', label: 'Demo video' }].map((item, i) => (
              <motion.div key={item.href} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease: easeOut }}>
                <Link className="mobile-link" href={item.href} onClick={() => setOpen(false)}>
                  {tr(item.label)} <ArrowUpRight size={24} aria-hidden="true" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
