'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CTAButton from './CTAButton';
import { useEffect, useState } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { cachedGetGlobalConfig } from '@/lib/cache/queries';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Lazy load the FloatingIcons component, and disable SSR since it's client-side only.
const FloatingIcons = dynamic(() => import('./FloatingIcons'), {
  ssr: false,
});

const HeroSection = () => {
  const cache = useCache();
  const [isSurveyActive, setIsSurveyActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cachedGetGlobalConfig(cache).then((config) => {
      setIsSurveyActive(config.isSurveyActive);
      setIsLoading(false);
    });
  }, [cache]);

  const startSurveyButton = (
    <CTAButton
      href="/step-introduction"
      className="px-8 py-3 text-lg font-bold sm:text-xl"
      disabled={!isSurveyActive || isLoading}
    >
      Start Survey
    </CTAButton>
  );

  return (
    <section id="about-research" className="landing-hero-section pt-20">
      <FloatingIcons />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
        <h2 className="landing-hero-title">Contribute to Groundbreaking Research</h2>
        <p className="hero-paragraph mx-auto mt-6 max-w-2xl">
          Join our study on <strong className="hero-paragraph-highlight">Dark Patterns in LLMs</strong>. Your
          participation is crucial for building a human-validated DPO dataset and fostering more ethical AI.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-x-6 gap-y-4 sm:flex-row">
          {!isSurveyActive ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>{startSurveyButton}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The survey is currently closed. Please check the updates below for more information.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            startSurveyButton
          )}
          <Link href="/about-research" className="btn-link-dark text-sm leading-6 font-semibold">
            Learn more <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
