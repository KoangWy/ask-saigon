import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext', 'vietnamese'], axes: ['wdth', 'opsz'], variable: '--font-display-face', display: 'swap' });
const body = Be_Vietnam_Pro({ subsets: ['latin', 'latin-ext', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-body-face', display: 'swap' });

export const metadata: Metadata = { metadataBase: new URL('https://ask-saigon.vercel.app'), title: 'Ask Saigon: get to know the city', description: 'A travel companion for Ho Chi Minh City, grounded in local sources.', openGraph: { title: 'Ask Saigon', description: 'Get to know the city, one good question at a time.', images: ['/og.jpg'] } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', interactiveWidget: 'resizes-content', themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f8f6ec' }, { media: '(prefers-color-scheme: dark)', color: '#0b1a15' }] };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${display.variable} ${body.variable}`}><body>{children}</body></html>; }
