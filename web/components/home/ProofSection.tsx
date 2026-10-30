'use client';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarCheck, LinkSimple, Tag } from '@phosphor-icons/react';
import { LogoMark } from '@/components/brand/Logo';
import CardRenderer from '@/components/cards/CardRenderer';
import Reveal, { easeOut } from '@/components/motion/Reveal';
import { canned } from '@/lib/canned';
import { useLanguage } from '@/lib/client/language';
import { pageText, strings } from '@/lib/i18n';

const points = [
  { icon: LinkSimple, title: 'Sources on every card', body: 'Place details link back to where they came from.' },
  { icon: CalendarCheck, title: 'Checked dates', body: 'Hours and prices carry the date they were last checked.' },
  { icon: Tag, title: 'Labeled examples', body: 'Saved sample answers and simulations are always marked as such.' },
];
const reply = canned('price-cyclo');
const noop = () => {};

export default function ProofSection() {
  const { lang } = useLanguage();
  const tr = (text: string) => pageText(lang, text);
  const reduce = useReducedMotion();
  const step = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.4 }, transition: { duration: 0.7, delay, ease: easeOut } });

  return (
    <section className="section bg-bg-tint">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <Reveal>
            <h2 className="section-title">{tr('Answers you can')} <span className="em">{tr('trace.')}</span></h2>
            <p className="section-lead">{tr('Every card shows where its facts come from and when they were checked.')}</p>
          </Reveal>
          <ul className="mt-10 grid gap-6 p-0" style={{ listStyle: 'none' }}>
            {points.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={0.1 + i * 0.08} className="flex gap-4">
                <span className="grid size-11 flex-none place-items-center rounded-full bg-surface text-accent-text"><Icon size={22} aria-hidden="true" /></span>
                <span><strong className="block text-[17px]">{tr(title)}</strong><span className="text-[15px] text-ink-soft">{tr(body)}</span></span>
              </Reveal>
            ))}
          </ul>
        </div>
        <figure className="proof-panel m-0">
          <motion.div className="message user" {...step(0.1)}>
            <div className="message-content"><div className="bubble">{strings[lang].price}</div></div>
          </motion.div>
          <motion.div className="message assistant" {...step(0.55)}>
            <div className="avatar small"><LogoMark size={30} /></div>
            <div className="message-content">
              <div className="bubble">{lang === 'vi' ? 'Với chuyến xích lô một giờ, 300k cao hơn nhiều so với giá tham khảo.' : reply.reply_text}</div>
              {reply.blocks.map((block, i) => <CardRenderer key={i} block={lang === 'vi' && block.type === 'price_check' ? { ...block, tip: 'Thỏa thuận tổng giá và thời gian trước khi đi.' } : block} lang={lang} sample send={noop} setItinerary={noop} />)}
            </div>
          </motion.div>
          <figcaption className="mt-3 px-1 text-[13px] text-muted">{tr('A real answer from the demo')}</figcaption>
        </figure>
      </div>
    </section>
  );
}
