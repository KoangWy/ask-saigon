'use client';
import { motion, useReducedMotion } from 'motion/react';

export const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Reveal({ children, className, id, delay = 0, y = 28, as = 'div' }: { children: React.ReactNode; className?: string; id?: string; delay?: number; y?: number; as?: 'div' | 'li' | 'section' | 'article' }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag id={id} className={className} initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8, delay, ease: easeOut }}>
      {children}
    </Tag>
  );
}
