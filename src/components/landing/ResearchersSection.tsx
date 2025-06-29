// src/components/landing/ResearchersSection.tsx
import Link from 'next/link';
import { cachedFetchAllResearchers } from '@/lib/cache/queries';
import ResearcherCard from './ResearcherCard';

const ResearchersSection = async () => {
  const allResearchers = await cachedFetchAllResearchers();
  const featuredResearchers = allResearchers.slice(0, 3);

  return (
    <section id="researchers" className="section-alt-bg py-16 sm:py-24">
      <div className="section-container">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="section-title">Meet the Researchers</h2>
          <p className="hero-paragraph mx-auto mt-4 max-w-2xl">
            This project is led by a dedicated team of AI ethics and user experience researchers.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        >
          {featuredResearchers.map((researcher, index) => (
            <ResearcherCard
              key={researcher.uid}
              name={researcher.displayName || 'No Name'}
              role={researcher.role || 'Researcher'}
              imageUrl={researcher.photoURL || undefined}
              animationDelay={`${index * 150}ms`}
            />
          ))}
        </ul>
        <div className="mt-16 text-center">
          <Link
            href="/researchers"
            className="btn-link-dark px-6 py-2.5 text-base"
            aria-label="Learn more about our research team"
          >
            Learn More About Our Team
          </Link>
        </div>
      </div>
    </section>
  );
};
export default ResearchersSection;
