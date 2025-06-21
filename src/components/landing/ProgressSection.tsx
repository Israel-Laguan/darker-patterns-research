// src/components/landing/ProgressSection.tsx
'use client';
import useScrollAnimation from '@/hooks/useScrollAnimation';
import { getProjectProgress } from '@/lib/landing/database';
import React, { useEffect, useState } from 'react';
import LandingProgressBar from './LandingProgressBar';

const mockProgressData = [
  { label: 'Overall Dataset Annotation', percentage: 75, colorClass: 'bg-brand-purple-500' },
  { label: 'Entries without Unresolved Flags', percentage: 90, colorClass: 'bg-accent-cyan' },
  { label: 'Min. 10 Reviews per Entry Target', percentage: 60, colorClass: 'bg-accent-pink' },
];

const ProgressSection = () => {
  const sectionRef = useScrollAnimation({ animationClass: 'anim-fade-in-up', threshold: 0.2, triggerOnce: true });
  const [progressData, setProgressData] = useState(mockProgressData);

  useEffect(() => {
    getProjectProgress()
      .then(setProgressData)
      .catch(() => setProgressData(mockProgressData));
  }, []);

  return (
    <section id="progress" className="bg-dark-bg-primary py-16 sm:py-24">
      <div
        ref={sectionRef as React.RefObject<HTMLDivElement>}
        className="scroll-animate-item mx-auto max-w-3xl px-6 lg:px-8"
      >
        <h2 className="section-title">Dataset Completion Progress</h2>
        <div className="space-y-6 sm:space-y-8">
          {progressData.map((item, index) => (
            <LandingProgressBar
              key={index}
              label={item.label}
              percentage={item.percentage}
              colorClass={item.colorClass}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
export default ProgressSection;
