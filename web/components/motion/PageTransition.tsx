'use client';
import { ViewTransition } from 'react';

// Directional page transitions: links into the product carry 'page-forward', links home carry 'page-back'.
const types = { 'page-forward': 'page-forward', 'page-back': 'page-back', default: 'none' };
export const forward = ['page-forward'];
export const back = ['page-back'];
export const transitionFor = (href: string) => (href === '/' || href.startsWith('/#') ? back : forward);

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <ViewTransition enter={types} exit={types} default="none">{children}</ViewTransition>;
}
