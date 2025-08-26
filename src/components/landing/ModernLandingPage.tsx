'use client';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Github,
  Linkedin,
  Menu,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const ModernLandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Floating particles animation
  const FloatingParticles = () => {
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
    }));

    return (
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-xl"
            style={{
              width: particle.size + 'rem',
              height: particle.size + 'rem',
              left: particle.x + '%',
              top: particle.y + '%',
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -30, 30, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    );
  };

  // Navigation with glassmorphism
  const Navigation = () => (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200/20 bg-white/70 backdrop-blur-2xl dark:bg-gray-950/70"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent">
              DPV Research
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {[
              { name: 'About', url: '/about-research' },
              { name: 'Benefits', url: '/benefits' },
              { name: 'Researchers', url: '/researchers' },
            ].map((item) => (
              <motion.a
                key={item.name}
                href={item.url}
                className="font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                {item.name}
              </motion.a>
            ))}
            <motion.a
              href="/step-introduction"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30"
            >
              Start Survey
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 md:hidden">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/95 backdrop-blur-xl md:hidden dark:bg-gray-950/95"
          >
            <div className="space-y-4 px-4 py-6">
              {['About', 'Benefits', 'Researchers'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block py-2 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <Link
                href="/step-introduction"
                className="block w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-center font-semibold text-white"
              >
                Start Survey
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );

  // Hero Section with parallax
  const HeroSection = () => (
    <motion.section
      ref={heroRef}
      style={{ opacity, scale }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950"
    >
      <FloatingParticles />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
            Groundbreaking AI Ethics Research
          </span>

          <h1 className="mb-6 text-5xl font-bold sm:text-6xl lg:text-7xl">
            <span className="bg-300% animate-gradient bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Shape the Future
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">of Ethical AI</span>
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600 dark:text-gray-300">
            Join our pioneering study on Dark Patterns in Large Language Models. Your insights will help create more
            transparent, trustworthy AI systems for everyone.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <motion.a
              href="/step-introduction"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/25 transition-all hover:shadow-2xl hover:shadow-purple-500/30"
            >
              Start Your Journey
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.a>

            <motion.a
              href="/about-research"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full border border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-900 shadow-lg transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              Learn More
            </motion.a>
          </div>
        </motion.div>

        {/* Animated Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3"
        >
          {[
            { number: '10K+', label: 'Participants', icon: Users },
            { number: '95%', label: 'Completion Rate', icon: CheckCircle },
            { number: '50+', label: 'Research Papers', icon: FileText },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:bg-gray-800/80"
            >
              <stat.icon className="mb-2 h-8 w-8 text-purple-600" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.number}</div>
              <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );

  // Benefits Section with cards
  const BenefitsSection = () => {
    const benefits = [
      {
        icon: FileText,
        title: 'Access Research Findings',
        description: 'Get exclusive access to groundbreaking research papers and insights.',
        gradient: 'from-blue-500 to-cyan-500',
      },
      {
        icon: Brain,
        title: 'Shape AI Ethics',
        description: 'Directly influence the development of ethical AI guidelines.',
        gradient: 'from-purple-500 to-pink-500',
      },
      {
        icon: Users,
        title: 'Join Global Community',
        description: 'Connect with researchers and participants worldwide.',
        gradient: 'from-green-500 to-teal-500',
      },
      {
        icon: Zap,
        title: 'Drive Innovation',
        description: 'Contribute to cutting-edge AI safety research.',
        gradient: 'from-orange-500 to-red-500',
      },
    ];

    return (
      <section id="benefits" className="bg-gray-50 py-24 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Why Participate?</h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-400">
              Your contribution makes a real difference in creating safer, more aligned AI systems.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative"
              >
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                />
                <div className="relative rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl dark:bg-gray-800">
                  <div
                    className={`h-14 w-14 bg-gradient-to-r ${benefit.gradient} mb-4 flex items-center justify-center rounded-xl`}
                  >
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Progress Section with animated charts
  const ProgressSection = () => {
    const [progress, setProgress] = useState({
      overall: 0,
      quality: 0,
      reviews: 0,
    });

    useEffect(() => {
      setTimeout(() => {
        setProgress({
          overall: 75,
          quality: 90,
          reviews: 60,
        });
      }, 500);
    }, []);

    return (
      <section id="progress" className="bg-white py-24 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Research Progress</h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-400">
              Track our collective progress towards building a comprehensive dataset.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              {[
                { label: 'Overall Dataset Completion', value: progress.overall, color: 'from-purple-500 to-pink-500' },
                { label: 'Data Quality Score', value: progress.quality, color: 'from-blue-500 to-cyan-500' },
                { label: 'Peer Review Coverage', value: progress.reviews, color: 'from-green-500 to-teal-500' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="mb-2 flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 p-8 dark:from-purple-900/20 dark:to-pink-900/20">
              <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Live Statistics</h3>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, label: 'Daily Submissions', value: '1,234' },
                  { icon: Users, label: 'Active Participants', value: '8,456' },
                  { icon: Clock, label: 'Avg. Response Time', value: '4.2 min' },
                  { icon: CheckCircle, label: 'Validation Rate', value: '98.5%' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between rounded-xl bg-white p-3 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <stat.icon className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700 dark:text-gray-300">{stat.label}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{stat.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Team Section
  const TeamSection = () => {
    const team = [
      {
        name: 'Dr. Sarah Chen',
        role: 'Lead AI Ethics Researcher',
        image: '👩‍🔬',
        social: { linkedin: '#', github: '#' },
      },
      {
        name: 'Prof. Michael Roberts',
        role: 'Machine Learning Expert',
        image: '👨‍💼',
        social: { linkedin: '#', github: '#' },
      },
      {
        name: 'Dr. Emily Johnson',
        role: 'UX Research Director',
        image: '👩‍💻',
        social: { linkedin: '#', github: '#' },
      },
    ];

    return (
      <section id="team" className="bg-gray-50 py-24 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Meet Our Team</h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-400">
              World-class researchers dedicated to advancing AI safety and ethics.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="rounded-2xl bg-white p-8 text-center shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
              >
                <div className="mb-4 text-6xl">{member.image}</div>
                <h3 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">{member.role}</p>
                <div className="flex justify-center gap-4">
                  <a href={member.social.linkedin} className="text-gray-400 transition-colors hover:text-purple-600">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href={member.social.github} className="text-gray-400 transition-colors hover:text-purple-600">
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Footer
  const Footer = () => (
    <footer className="bg-gray-900 py-12 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-4 flex items-center gap-3 md:mb-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DPV Research</span>
          </div>

          <div className="mb-4 flex gap-6 md:mb-0">
            <a href="/ethics-privacy-participation" className="text-gray-400 transition-colors hover:text-white">
              Ethics & Privacy
            </a>
            <a href="/terms-conditions" className="text-gray-400 transition-colors hover:text-white">
              Terms
            </a>
            <a href="/contact-us" className="text-gray-400 transition-colors hover:text-white">
              Contact
            </a>
          </div>

          <p className="text-sm text-gray-400">© 2025 DPV Research. Built with ❤️ by Anthony Laguan.</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen">
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .bg-300\% {
          background-size: 300% 300%;
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
      <Navigation />
      <HeroSection />
      <BenefitsSection />
      <ProgressSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default ModernLandingPage;

// Start Survey 1 - /step-introduction
// Learn More 2 - /about-research
// About 1 - /about-research
// Benefits 2 - /benefits
// Researchers 3 - /researchers
// Learn More About Our Team 1 - /researchers
// Learn More About Benefits 2 - /benefits
