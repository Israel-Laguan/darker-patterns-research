'use client';

import type { DemographicsSummary } from '@/types/stats';
import { PieChartCard } from './charts/PieChartCard';
import { createChartConfig, transformDistributionData } from './charts/utils';
import { TotalParticipantsCard } from './TotalParticipantsCard';

interface DemographicsDisplayAdminProps {
  summary: DemographicsSummary | null;
}

const DemographicsDisplayAdmin = ({ summary }: DemographicsDisplayAdminProps) => {
  if (!summary) {
    return (
      <p className="p-4 text-center text-gray-500 dark:text-gray-400">
        Demographics data is not available or still loading.
      </p>
    );
  }

  const ageData = transformDistributionData(summary.ageGroupDistribution);
  const genderData = transformDistributionData(summary.genderDistribution);
  const educationData = transformDistributionData(summary.educationDistribution);
  const expertiseData = transformDistributionData(summary.expertiseDistribution);
  const aiFamiliarityData = transformDistributionData(summary.aiFamiliarityDistribution);

  const ageChartConfig = createChartConfig(ageData, 'name');
  const genderChartConfig = createChartConfig(genderData, 'name');
  const educationChartConfig = createChartConfig(educationData, 'name');
  const expertiseChartConfig = createChartConfig(expertiseData, 'name');
  const aiFamiliarityChartConfig = createChartConfig(aiFamiliarityData, 'name');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <PieChartCard data={ageData} title="Age Group Distribution" chartConfig={ageChartConfig} />
      <PieChartCard data={genderData} title="Gender Distribution" chartConfig={genderChartConfig} />
      <PieChartCard data={educationData} title="Education Level Distribution" chartConfig={educationChartConfig} />
      <PieChartCard data={expertiseData} title="Field of Expertise" chartConfig={expertiseChartConfig} />
      <PieChartCard data={aiFamiliarityData} title="AI Familiarity" chartConfig={aiFamiliarityChartConfig} />

      <TotalParticipantsCard
        total={summary.totalParticipantsWithDemographics || 0}
        lastUpdatedAt={summary.lastUpdatedAt}
      />
    </div>
  );
};

export default DemographicsDisplayAdmin;
