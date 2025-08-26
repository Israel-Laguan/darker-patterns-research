'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Brain, FileText, Users, Zap } from 'lucide-react';
import { useRef, useState } from 'react';

// Define benefits outside the component
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

const BenefitsSection = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

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

export default BenefitsSection;
