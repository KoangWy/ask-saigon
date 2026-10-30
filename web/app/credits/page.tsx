'use client';
import Image from 'next/image';
import PageTransition from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';
import { photoAlt, photos } from '@/lib/photos';

export default function Credits() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main className="wrap pb-24 pt-14 md:pt-20">
          <Reveal className="mb-12 max-w-[640px]">
            <h1 className="section-title">{tr('Photo credits')}</h1>
            <p className="section-lead">{tr('Every photo on Ask Saigon comes from Wikimedia Commons and is used under the license shown.')}</p>
          </Reveal>
          <div className="credits-list">
            {photos.map(p => (
              <figure key={p.slug}>
                <div className="photo-frame aspect-[4/3]"><Image src={p.file} alt={photoAlt(p, lang)} fill sizes="(min-width: 1024px) 300px, 50vw" /></div>
                <figcaption>
                  <strong>{photoAlt(p, lang)}</strong>
                  {tr('Photo by')} {p.author}, {p.license_url ? <a href={p.license_url} target="_blank" rel="noreferrer">{p.license}</a> : p.license}
                  <br /><a href={p.page_url} target="_blank" rel="noreferrer">{tr('View on Wikimedia Commons')}</a>
                </figcaption>
              </figure>
            ))}
          </div>
        </main>
        <SiteFooter />
      </PageTransition>
    </>
  );
}
