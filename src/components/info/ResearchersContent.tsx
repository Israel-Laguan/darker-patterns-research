import { Linkedin, Mail, UserCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

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
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={120}
          height={120}
          className="flex-shrink-0 rounded-full object-cover shadow-md"
        />
      ) : (
        <div className="bg-light-bg-tertiary mb-2 flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full shadow-md">
          <UserCircle2 size={60} className="text-brand-purple-400" />
        </div>
      )}
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

const ResearchersContent = () => {
  const researchers = [
    {
      name: 'Israel A. Rosales L.',
      role: 'Principal Investigator & Lead Researcher',
      bio: 'Israel is driving this research to explore and mitigate dark patterns in LLMs, focusing on creating robust datasets and evaluation benchmarks for more ethical AI systems. His work aims to bridge the gap between AI capabilities and human-centered design principles.',
      // imageUrl: "/path/to/israel-photo.jpg", // Placeholder if you have an image
      linkedinUrl: 'https://www.linkedin.com/in/israel-a-rosales-l/',
      email: 'ai.darkpatterns.research@gmail.com',
    },
    // {
    //   name: "Dr. AI Ethicist (Example)",
    //   role: "Ethics Advisor & Collaborator",
    //   bio: "Dr. Ethicist provides crucial guidance on the ethical implications of this research and helps ensure the study aligns with best practices for responsible AI development and human subject research.",
    //   linkedinUrl: "#",
    // },
    // Add more team members here
  ];

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
          {researchers.map((researcher, index) => (
            <ResearcherProfileCard key={index} {...researcher} />
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
