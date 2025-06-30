// components/admin/AdminStatisticsContent.tsx
import ProjectProgressChart from '@/components/admin/charts/ProjectProgressChart';
import { cachedGetDashboardData, cachedGetStatisticsData } from '@/lib/cache/queries';
import AdminHeader from './AdminHeader';
import { ContentCard } from './ContentCard';
import DemographicsDisplayAdmin from './DemographicsDisplayAdmin';
import ExportDpoDatasetButton from './ExportDpoDatasetButton';
import ResponseAnalyticsDisplay from './ResponseAnalyticsDisplay';

const AdminStatisticsContent = async () => {
  const { demographicsSummary, overviewStats, responseAggregates } = await cachedGetStatisticsData();
  const { projectProgress } = await cachedGetDashboardData();

  return (
    <>
      <AdminHeader
        title="Survey Statistics & Analytics"
        objective="View aggregated statistics from participant surveys, analyze trends, and export data."
      />
      <div className="space-y-8">
        <ContentCard title="Project Progress Overview">
          <ProjectProgressChart data={projectProgress} />
        </ContentCard>
        <ContentCard title="Data Export">
          <ExportDpoDatasetButton />
        </ContentCard>
        <ContentCard title="Response Analytics">
          <ResponseAnalyticsDisplay overviewStats={overviewStats} responseAggregates={responseAggregates} />
        </ContentCard>
        <ContentCard title="Participant Demographics" id="demographics">
          <DemographicsDisplayAdmin summary={demographicsSummary} />
        </ContentCard>
      </div>
    </>
  );
};
export default AdminStatisticsContent;
