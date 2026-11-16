import type { Metadata } from 'next';
import HotelDemo from './HotelDemo';
export const metadata: Metadata = { title: 'Khách Sạn Của Bạn (demo partner app)', robots: { index: false } };
export default function Page() { return <HotelDemo />; }
