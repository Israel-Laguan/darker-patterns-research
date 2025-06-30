import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, PieChart, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import AdminHeader from '@/components/admin/AdminHeader';
import DemographicsCharts from '@/components/admin/charts/DemographicsCharts';

import StatCardAdmin from '@/components/admin/StatCardAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { cachedGetDashboardData } from '@/lib/cache/queries';

export const metadata: Metadata = { title: 'Project Overview - DPO Admin' };

const AdminDashboardPage = async () => {
  const dashboardData = await cachedGetDashboardData();

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <AdminHeader title="Project Overview" />

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardAdmin title="Total Entries" value={dashboardData.totalEntries} icon={<PieChart />} />
        <StatCardAdmin title="Entries Completed" value={dashboardData.entriesCompleted} icon={<CheckCircle />} />
        <StatCardAdmin title="Avg. Time per Entry" value={dashboardData.avgTimePerEntry} icon={<Clock />} />
        <StatCardAdmin title="Active Participants" value={dashboardData.activeParticipants} icon={<Users />} />
      </section>

      {/* Charts Section */}
      <section>
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Participant Demographics</h2>
              <Link
                href="/admin/statistics#demographics"
                className="text-brand-purple-400 text-sm font-medium hover:underline"
              >
                View All
              </Link>
            </div>
            <DemographicsCharts data={dashboardData.demographics} />
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
        <div className="admin-card p-0">
          {dashboardData.recentActivity.length > 0 ? (
            <ul className="activity-list">
              {dashboardData.recentActivity.map((item) => {
                const content = (
                  <div className="activity-item-content">
                    <div className="flex-1 space-y-1">
                      <p className="activity-item-text-primary">{item.description}</p>
                      <p className="activity-item-text-secondary">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className="activity-item block transition-colors hover:bg-white/5">
                        {content}
                      </Link>
                    ) : (
                      <div className="activity-item">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground p-6 text-center text-sm">No recent activity to display.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
