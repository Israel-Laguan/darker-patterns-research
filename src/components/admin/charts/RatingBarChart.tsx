'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/types/charts';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { BarChartData } from '@/types/charts';

interface RatingBarChartProps {
  data: BarChartData[];
  chartConfig: ChartConfig;
}

export function RatingBarChart({ data, chartConfig }: RatingBarChartProps) {
  if (!data?.length) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-medium dark:text-gray-100">Evaluation Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          (Rating distribution data not available)
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-medium dark:text-gray-100">Evaluation Rating Distribution</CardTitle>
        <CardDescription className="text-xs text-gray-400 dark:text-gray-500">
          Distribution of star ratings given by participants.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal" margin={{ top: 5, right: 10, left: 10, bottom: 20 }} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#6b7280" fontSize={10} interval={0} />
              <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.3)' }}
                content={<ChartTooltipContent labelClassName="text-sm" indicator="dot" />}
              />
              <Bar dataKey="count" name="Submissions" radius={[4, 4, 0, 0]} fill="#82ca9d">
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.fill as string}
                    name={String(entry.name)} // Ensure name is always a string
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
