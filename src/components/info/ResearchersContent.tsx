import { cachedFetchAllResearchers } from '@/lib/cache/queries';
import type { AppUser } from '@/types/user';
import { Linkedin, Mail, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface ResearcherProfileProps {
  name: string;
  role: string;
  bio: string;
  imageUrl?: string | null;
  linkedinUrl?: string;
  email?: string;
}

const ResearcherProfileCard: React.FC<ResearcherProfileProps> = ({ name, role, bio, imageUrl, linkedinUrl, email }) => {
  return (
    <div className="bg-light-bg-secondary border-light-border-primary flex flex-col items-center gap-6 rounded-lg border p-6 shadow-lg sm:flex-row sm:items-start">
      <Avatar className="flex h-32 w-32 items-center justify-center rounded-lg">
        <AvatarImage src={imageUrl || undefined} alt={name} className="object-cover" />
        <AvatarFallback className="bg-light-bg-tertiary flex h-32 w-32">
          <UserCircle2 size={60} className="text-brand-purple-400" />
        </AvatarFallback>
      </Avatar>
      <div className="text-center sm:text-left">
        <h3 className="font-lora text-light-text-primary text-xl font-semibold">{name}</h3>
        <p className="text-brand-purple-600 text-sm font-medium">{role}</p>
        <p className="text-light-text-secondary mt-2 text-sm leading-relaxed">{bio}</p>
        <div className="mt-4 flex justify-center space-x-3 sm:justify-start">
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-light-text-tertiary hover:text-brand-purple-500 transition-colors"
            >
              <Linkedin size={20} />
              <span className="sr-only">LinkedIn Profile</span>
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-light-text-tertiary hover:text-brand-purple-500 transition-colors"
            >
              <Mail size={20} />
              <span className="sr-only">Email</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const ResearchersContent = async () => {
  const researchers: AppUser[] = await cachedFetchAllResearchers();

  return (
    <div className="survey-page-container">
      <article className="prose prose-sm sm:prose-base lg:prose-lg prose-headings:font-lora prose-headings:text-light-text-primary prose-p:text-light-text-secondary prose-strong:text-light-text-primary prose-a:text-brand-purple-500 hover:prose-a:text-brand-purple-600 mx-auto max-w-4xl">
        {' '}
        {/* Wider for profiles */}
        <h1 className="survey-main-title !mb-6 text-center sm:!mb-8">Meet the Research Team</h1>
        <p className="mb-10 text-center">
          This project is led by a dedicated researcher passionate about advancing AI safety and ethics. We are
          committed to rigorous scientific inquiry and open collaboration.
        </p>
        <div className="not-prose space-y-8 md:space-y-10">
          {' '}
          {/* Use not-prose for custom card layout */}
          {researchers.map((researcher) => (
            <ResearcherProfileCard
              key={researcher.uid}
              name={researcher.displayName || 'No Name Provided'}
              role={researcher.role || 'Researcher'}
              bio={researcher.bio || ''}
              imageUrl={researcher.photoURL || undefined}
              linkedinUrl={researcher.linkedinUrl}
              email={researcher.email || undefined}
            />
          ))}
        </div>
        <section id="collaboration" className="border-light-border-primary mt-12 border-t pt-8">
          <h2 className="font-lora text-center">Interested in Collaboration?</h2>
          <p className="text-center">
            We are open to collaborations with fellow researchers, institutions, and industry partners who share our
            commitment to ethical AI. If you are interested in working with us, please{' '}
            <Link href="/contact-us">get in touch</Link>.
          </p>
        </section>
      </article>
    </div>
  );
};
export default ResearchersContent;
