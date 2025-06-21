// components/landing/StatsSection.tsx
import StatCard from '@/components/common/StatCard';
import { getCachedStats } from '@/lib/landing/database';
import { Timestamp } from 'firebase/firestore';
import { CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';

const StatsSection = async () => {
  const statsData = await getCachedStats();

  const lastUpdatedDate = statsData?.lastUpdatedAt
    ? statsData.lastUpdatedAt instanceof Timestamp
      ? statsData.lastUpdatedAt.toDate()
      : new Date(statsData.lastUpdatedAt.seconds * 1000)
    : new Date();

  const statsToDisplay = [
    {
      title: 'Agreement Rate',
      value: statsData?.agreementRate ?? 0,
      unit: '%',
      icon: <CheckCircle size={24} />,
      changeColor:
        Number(statsData?.agreementRate) > 60
          ? 'text-green-500'
          : Number(statsData?.agreementRate) >= 30
            ? 'text-yellow-500'
            : 'text-red-500',
      changeText: `${statsData?.totalAgreementCount}/${statsData?.totalEvaluationsSubmitted}`,
    },
    {
      title: 'Evaluations Submitted',
      value: statsData?.totalEvaluationsSubmitted?.toLocaleString() ?? 'N/A',
      icon: <TrendingUp size={24} />,
      changeColor:
        Number(statsData?.usersWithEmailAddressCount) > 50
          ? 'text-green-500'
          : Number(statsData?.usersWithEmailAddressCount) >= 10
            ? 'text-yellow-500'
            : 'text-red-500',
      changeText: `Participants Subscribed: ${statsData?.usersWithEmailAddressCount}`,
    },
    {
      title: 'Fully Reviewed Entries',
      value: `${statsData?.fullyReviewedEntriesCount ?? 0}/700`,
      icon: <Zap size={24} />,
      changeText: `Updated: ${lastUpdatedDate.toLocaleDateString()}`,
    },
    {
      title: 'Average Time per Evaluation',
      value: `${Number(statsData?.averageTimePerEvaluationMs ?? 0) / 1000} s`,
      icon: <Clock size={24} />,
      changeColor:
        Number(statsData?.averageTimePerEvaluationMs ?? 0) > 60 * 1000
          ? 'text-green-500'
          : Number(statsData?.averageTimePerEvaluationMs ?? 0) >= 30 * 1000
            ? 'text-yellow-500'
            : 'text-red-500',
      changeText: Number(statsData?.averageTimePerEvaluationMs ?? 0) > 60 * 1000 ? 'Fast Pace' : 'Slow Pace',
    },
  ];

  return (
    <section id="progress" className="section-alt-bg py-16 sm:py-24">
      <div className="section-container">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <h2 className="section-title">Project Progress & Statistics</h2>
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 text-center lg:grid-cols-4">
            {statsToDisplay.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value.toString()}
                icon={stat.icon}
                changeText={stat.changeText}
                changeColor={stat.changeColor}
                unit={stat.unit}
                className="scroll-animate-item"
                animated
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default StatsSection;
