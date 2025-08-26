'use client';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

// Progress Section with animated charts
const ProgressSection = () => {
  const [progress, setProgress] = useState({
    overall: 0,
    quality: 0,
    reviews: 0,
  });

  useEffect(() => {
    // Save the timeout ID
    const timeoutId = setTimeout(() => {
      setProgress({
        overall: 75,
        quality: 90,
        reviews: 60,
      });
    }, 500);

    // Cleanup function to clear the timeout if component unmounts
    return () => clearTimeout(timeoutId);
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
export default ProgressSection;
