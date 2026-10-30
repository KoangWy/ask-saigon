'use client';
import AskGallery from '@/components/home/AskGallery';
import CityFrames from '@/components/home/CityFrames';
import Closing from '@/components/home/Closing';
import Hero from '@/components/home/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import ProofSection from '@/components/home/ProofSection';
import PageTransition from '@/components/motion/PageTransition';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';

export default function Home() {
  return (
    <>
      <SiteHeader overlay />
      <PageTransition>
        <main className="home">
          <Hero />
          <AskGallery />
          <ProofSection />
          <CityFrames />
          <HowItWorks />
          <Closing />
        </main>
        <SiteFooter />
      </PageTransition>
    </>
  );
}
