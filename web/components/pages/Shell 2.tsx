'use client';
import PageTransition from '@/components/motion/PageTransition';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';

// Frame for the community pages (routes, contributions, review, stats).
export default function Shell({ title, lead, children }: { title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main className="wrap pb-24 pt-14 md:pt-20 community">
          <div className="mb-10 max-w-[680px]">
            <h1 className="section-title">{title}</h1>
            {lead && <p className="section-lead">{lead}</p>}
          </div>
          {children}
        </main>
        <SiteFooter />
      </PageTransition>
    </>
  );
}
