'use client';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';
import Link from 'next/link';
export default function NotFound() { const {lang}=useLanguage(); const tr=(text:string)=>pageText(lang,text); return <main className="wrap not-found"><span className="eyebrow">{tr("OFF THE MAP")}</span><h1>{tr("This street ends here.")}</h1><p>{tr("Let’s find our way back.")}</p><Link className="button primary" href="/">{tr("Back home ↗")}</Link></main>; }
