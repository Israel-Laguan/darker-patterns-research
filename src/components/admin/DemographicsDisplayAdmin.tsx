'use client';

import { BarChartData, ChartDataItem } from '@/types/charts';
import type { DemographicsSummary } from '@/types/stats';
import { DemographicsBarChart } from './charts/DemographicsBarChart';
import { createChartConfig, transformDistributionData } from './charts/utils';
import { TotalParticipantsCard } from './TotalParticipantsCard';

interface DemographicsDisplayAdminProps {
  summary: DemographicsSummary | null;
}

const DemographicsDisplayAdmin = ({ summary }: DemographicsDisplayAdminProps) => {
  if (!summary) {
    return (
      <p className="text-dark-text-secondary p-4 text-center">Demographics data is not available or still loading.</p>
    );
  }

  const ageData = transformDistributionData(summary.ageGroupDistribution, 'ageGroup');
  const genderData = transformDistributionData(summary.genderDistribution, 'gender');
  const educationData = transformDistributionData(summary.educationDistribution, 'educationLevel');
  const expertiseData = transformDistributionData(summary.expertiseDistribution, 'fieldOfExpertise');
  const aiFamiliarityData = transformDistributionData(summary.aiFamiliarityDistribution, 'aiFamiliarityLevel');

  const ageChartConfig = createChartConfig(ageData as unknown as ChartDataItem[], 'ageGroup');
  const genderChartConfig = createChartConfig(genderData as unknown as ChartDataItem[], 'gender');
  const educationChartConfig = createChartConfig(educationData as unknown as ChartDataItem[], 'educationLevel');
  const expertiseChartConfig = createChartConfig(expertiseData as unknown as ChartDataItem[], 'fieldOfExpertise');
  const aiFamiliarityChartConfig = createChartConfig(
    aiFamiliarityData as unknown as ChartDataItem[],
    'aiFamiliarityLevel',
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <DemographicsBarChart
        data={ageData as unknown as BarChartData[]}
        title="Age Group Distribution"
        dataKey="ageGroup"
        chartConfig={ageChartConfig}
        layout="vertical"
      />
      <DemographicsBarChart
        data={genderData as unknown as BarChartData[]}
        title="Gender Distribution"
        dataKey="gender"
        chartConfig={genderChartConfig}
        layout="vertical"
      />
      <DemographicsBarChart
        data={educationData as unknown as BarChartData[]}
        title="Education Level Distribution"
        dataKey="educationLevel"
        chartConfig={educationChartConfig}
        layout="vertical"
      />
      <DemographicsBarChart
        data={expertiseData as unknown as BarChartData[]}
        title="Field of Expertise"
        dataKey="fieldOfExpertise"
        chartConfig={expertiseChartConfig}
        layout="vertical"
      />
      <DemographicsBarChart
        data={aiFamiliarityData as unknown as BarChartData[]}
        title="AI Familiarity"
        dataKey="aiFamiliarityLevel"
        chartConfig={aiFamiliarityChartConfig}
        layout="vertical"
      />

      <TotalParticipantsCard
        total={summary.totalParticipantsWithDemographics || 0}
        lastUpdatedAt={summary.lastUpdatedAt}
      />
    </div>
  );
};

export default DemographicsDisplayAdmin;
