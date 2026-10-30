'use client';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react';
import Logo from '@/components/brand/Logo';
import { transitionFor } from '@/components/motion/PageTransition';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';

const columns = [
  { title: 'Product', links: [{ href: '/chat', label: 'Chat' }, { href: '/#ask', label: 'What you can ask' }, { href: '/#how', label: 'How it works' }] },
  { title: 'Business', links: [{ href: '/business', label: 'For business' }, { href: '/business#api', label: 'API preview' }] },
  { title: 'Project', links: [{ href: 'https://github.com/KoangWy/ask-saigon', label: 'GitHub', external: true }, { href: 'https://github.com/KoangWy/ask-saigon/blob/main/LICENSE', label: 'MIT license', external: true }, { href: '/credits', label: 'Photo credits' }] },
];

export default function SiteFooter() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link href="/" transitionTypes={transitionFor('/')} aria-label={tr('Home')}><Logo size={36} /></Link>
            <p className="mt-5 max-w-[34ch] text-[15px] text-cream/70">{tr('A travel companion for Ho Chi Minh City, grounded in local sources.')}</p>
          </div>
          {columns.map(col => (
            <div className="footer-col" key={col.title}>
              <h3>{tr(col.title)}</h3>
              <ul>
                {col.links.map(link => (
                  <li key={link.href}>
                    {'external' in link
                      ? <a href={link.href} target="_blank" rel="noreferrer">{tr(link.label)} <ArrowUpRight size={14} aria-hidden="true" /></a>
                      : <Link href={link.href} transitionTypes={transitionFor(link.href)}>{tr(link.label)}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>{tr('Demo data: District 1 + District 3, checked Oct 2026')}</p>
          <p>{tr('Photos: Wikimedia Commons contributors')}</p>
        </div>
      </div>
    </footer>
  );
}
