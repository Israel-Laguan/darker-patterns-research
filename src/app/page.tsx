// src/app/page.tsx
import ModernLandingPage from '@/components/landing/ModernLandingPage';
import type { Metadata } from 'next';

// Metadata for the root landing page
export const metadata: Metadata = {
  title: 'Dark Pattern Validation Project - Uncovering Deceptive Designs',
  description:
    'Join the Dark Pattern Validation Project to help identify, catalog, and understand dark patterns in LLMs and user interfaces. Contribute to building a more ethical digital environment.',
};

export default function RootPage() {
  return (
    <>
      <ModernLandingPage />
    </>
  );
}
