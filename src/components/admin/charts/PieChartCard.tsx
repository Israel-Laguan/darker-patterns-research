'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '@/components/ui/chart';
import type { PieChartCardProps } from '@/types/charts';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export function PieChartCard({ data, title, description, chartConfig }: PieChartCardProps) {
  if (!data?.length || data.every((d) => d.value === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium dark:text-gray-100">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs text-gray-400 dark:text-gray-500">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          (No data available)
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium dark:text-gray-100">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs text-gray-400 dark:text-gray-500">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="h-[250px] px-4 pb-2">
        <ChartContainer config={chartConfig} className="h-full w-full text-xs">
          <ResponsiveContainer width="100%" height="100%" className="-mt-2">
            <PieChart>
              <Tooltip cursor={{ fill: '#f3f4f6' }} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                labelLine={false}
                label={({ percent }) => (
                  <text x={0} y={0} textAnchor="middle" fill="#111827" fontSize={12} fontWeight={500}>
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                )}
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill as string} />
                ))}
              </Pie>
              <Legend
                content={<ChartLegendContent nameKey="name" className="mt-2 text-xs" />}
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: '4px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
