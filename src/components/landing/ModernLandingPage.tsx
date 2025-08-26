'use client'; // Only if this page uses client-side hooks itself

import BenefitsSection from './ModernBenefitsSection';
import FloatingParticles from './ModernFloatingParticles';
import Footer from './ModernFooter';
import HeroSection from './ModernHeroSection';
import Navigation from './ModernNavigation';
import ProgressSection from './ModernProgressSection';
import TeamSection from './ModernTeamSection';

const ModernLandingPage = () => {
  return (
    <>
      <FloatingParticles />
      <Navigation />
      <HeroSection />
      <BenefitsSection />
      <ProgressSection />
      <TeamSection />
      <Footer />
    </>
  );
};

export default ModernLandingPage;
