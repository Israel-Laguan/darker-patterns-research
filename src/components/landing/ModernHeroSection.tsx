'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle, FileText, Sparkles, Users } from 'lucide-react';
import { useRef } from 'react';
import FloatingParticles from './ModernFloatingParticles';

const HeroSection = () => {
  // Move all hooks INSIDE the component function
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
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
};

export default HeroSection;
