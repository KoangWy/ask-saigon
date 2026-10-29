import Link from 'next/link';
export default function NotFound() { return <main className="wrap not-found"><span className="eyebrow">OFF THE MAP</span><h1>This street ends here.</h1><p>Let’s find our way back.</p><Link className="button primary" href="/">Back home ↗</Link></main>; }
