'use client';
import { motion } from 'framer-motion';
import { Github, Linkedin } from 'lucide-react';

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
export default TeamSection;
