import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { metadataBase: new URL('https://ask-saigon.vercel.app'), title: 'Ask Saigon — get to know the city', description: 'A travel companion for Ho Chi Minh City, grounded in local sources.', openGraph: { title: 'Ask Saigon', description: 'Get to know the city, one good question at a time.', images: ['/og.svg'] } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', interactiveWidget: 'resizes-content' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
