'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowUpRight } from '@phosphor-icons/react';
import { LogoMark } from '@/components/brand/Logo';
import PageTransition, { forward } from '@/components/motion/PageTransition';
import Reveal, { easeOut } from '@/components/motion/Reveal';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useLanguage } from '@/lib/client/language';
import { pageText } from '@/lib/i18n';
import { photo, photoAlt } from '@/lib/photos';

const bars = [30, 50, 80, 60, 95, 55];

export default function Business() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const bridge = photo('ba-son-bridge-night');
  const tag = <span className="roadmap-tag">{tr('ROADMAP 6-12 MONTHS')}</span>;

  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main className="business">
          <section ref={heroRef} className="biz-hero wrap grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <Reveal><span className="eyebrow">{tr('FOR PEOPLE BUILDING FOR TRAVELERS')}</span></Reveal>
              <Reveal delay={0.05}><h1>{tr('Local knowledge,')}<br /><span className="em">{tr('made useful.')}</span></h1></Reveal>
              <Reveal delay={0.12}><p className="section-lead">{tr('Imagine a more helpful city experience, wherever your travelers are. These concepts are a look at what comes next.')}</p></Reveal>
              <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-3">
                <Link href="/chat" transitionTypes={forward} className="btn btn-primary">{tr('Try it for yourself')} <ArrowUpRight className="btn-arrow" size={18} weight="bold" aria-hidden="true" /></Link>
                <a href="#api" className="btn btn-ghost">{tr('API preview')} <ArrowDown size={16} aria-hidden="true" /></a>
              </Reveal>
            </div>
            <motion.div className="photo-frame aspect-[4/3] lg:aspect-[4/5]" initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: easeOut }}>
              <motion.div className="absolute inset-[-8%_0]" style={reduce ? undefined : { y: photoY }}>
                <Image src={bridge.file} alt={photoAlt(bridge, lang)} fill priority sizes="(min-width: 1024px) 45vw, 100vw" />
              </motion.div>
            </motion.div>
          </section>

          <div className="wrap business-grid">
            <Reveal as="section" id="api" className="business-block wide">
              {tag}
              <h2>{tr('Build with Ask Saigon')}</h2>
              <p>{tr('Structured local answers, ready to bring into your product. Bring your own model is on the roadmap; data and tool calls would be priced separately from model tokens.')}</p>
              <p className="caption">{lang === 'vi' ? 'Ví dụ API dưới đây dùng tiếng Anh; nội dung phản hồi phụ thuộc ngôn ngữ yêu cầu.' : 'The API example below uses English; responses follow the request language.'}</p>
              <div className="code-grid">
                <pre>{`POST /api/chat\n{\n  "input": { "kind": "sample",\n    "sample_id": "price-cyclo" },\n  "history": [],\n  "session_id": "550e8400-e29b-41d4-a716-446655440000",\n  "state": { "lang": "en", "offline": true,\n    "location": { "lat": 10.7724, "lng": 106.698,\n      "label": "Bến Thành", "source": "picked" },\n    "now": "2026-10-30T05:05:00.000Z" }\n}`}</pre>
                <pre>{`{\n  "reply_text": "For a one-hour cyclo ride, 300k is much higher than the reference.",\n  "blocks": [{ "type": "price_check",\n    "item": "xích lô", "unit": "hour", "reference_min": 70,\n    "reference_max": 100, "user_price": 300,\n    "verdict": "too_high", "tip": "Agree the total price and duration before riding.",\n    "source": "https://www.roughguides.com/vietnam/ho-chi-minh-city-and-around/", "checked_at": "2026-10-30" }],\n  "quick_replies": ["Nearby", "Plan my day"], "simulated": false,\n  "fallback": true, "source": "canned"\n}`}</pre>
              </div>
              <pre className="mt-3">{`<script src="https://example.com/ask-saigon-widget.js"></script>\n<div data-ask-saigon></div>`}</pre>
              <p className="caption">{tr('Illustrative embed · not yet available')}</p>
              <div className="pricing">
                <div><strong>Starter</strong><p>{tr('Free · 1k calls/mo')}</p></div>
                <div><strong>Growth</strong><p>{tr('Contact us')}</p></div>
                <div><strong>Enterprise</strong><p>{tr('Contact us')}</p></div>
              </div>
            </Reveal>

            <Reveal as="section" className="business-block">
              {tag}
              <h2>{tr('A portal for local partners')}</h2>
              <p>{tr('Give businesses a place to keep hours, menus, and offers current, with translation and profile suggestions.')}</p>
              <div className="mock-panel mock-form">
                <small>{tr('PARTNER PORTAL · ILLUSTRATIVE DATA')}</small>
                <label>{tr('Business name')} <span>Saigon Corner</span></label>
                <label>{tr('Opening hours')} <span>08:00-22:00</span></label>
                <label>{tr('Today’s special')} <span>{tr('Fresh local favorites')}</span></label>
                <div className="mock-button">{tr('Preview translation →')}</div>
              </div>
            </Reveal>

            <Reveal as="section" className="business-block tint" delay={0.08}>
              {tag}
              <h2>{tr('See what travelers need')}</h2>
              <p>{tr('Understand questions, destinations, peak hours, visitor origins, and places needing attention.')}</p>
              <div className="mock-panel bg-surface">
                <small>{tr('ILLUSTRATIVE DATA · QUESTIONS BY HOUR')}</small>
                <div className="bars">
                  {bars.map((h, i) => (
                    <motion.i key={i} style={{ height: `${h}%` }} initial={reduce ? false : { scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.9, delay: 0.1 + i * 0.07, ease: easeOut }} />
                  ))}
                </div>
                <div className="bars-axis"><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span></div>
              </div>
            </Reveal>

            <Reveal as="section" className="business-block tint">
              {tag}
              <h2>{tr('Suggestions worth trusting')}</h2>
              <p>{tr('Sponsored places would be clearly labeled and shown only when relevant. Payment would never lift a poor match above a better one.')}</p>
              <div className="mock-panel bg-surface">
                <small>{tr('SPONSORED · ILLUSTRATIVE DATA')}</small>
                <strong className="sponsor-name">Saigon Corner</strong>
                <p className="m-0 mt-1 text-[14px] text-ink-soft">{tr('A local stop for a slow afternoon')}</p>
              </div>
            </Reveal>

            <Reveal as="section" className="business-block" delay={0.08}>
              {tag}
              <h2>{tr('A journey to remember')}</h2>
              <p>{tr('A trip journal could bring photos, routes, and visited places together, ready to share.')}</p>
              <div className="mock-panel">
                <div className="flex items-start justify-between gap-4"><small>{tr('ILLUSTRATIVE DATA')}</small><LogoMark size={36} /></div>
                <strong className="journal-title">{tr('My day in Saigon')}</strong>
                <p className="m-0 mt-1 text-[14px] text-ink-soft">{tr('Bến Thành → a little lunch → sunset on Nguyễn Huệ')}</p>
                <div className="mock-button">{tr('Share to TikTok ↗')}</div>
              </div>
            </Reveal>

            <Reveal as="section" className="business-block wide">
              {tag}
              <h2>{tr('On the horizon')}</h2>
              <div className="timeline">
                <div><strong>{tr('More neighborhoods')}</strong><p>{tr('Grow the local data footprint.')}</p></div>
                <div><strong>API & SDK</strong><p>{tr('Bring local context to more products.')}</p></div>
                <div><strong>{tr('Partner portal')}</strong><p>{tr('Help local businesses keep details fresh.')}</p></div>
                <div><strong>{tr('City collaboration')}</strong><p>{tr('Explore working with tourism partners.')}</p></div>
              </div>
            </Reveal>
          </div>
        </main>
        <SiteFooter />
      </PageTransition>
    </>
  );
}
