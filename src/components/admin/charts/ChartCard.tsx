'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { ChartCardProps } from '@/types/charts';

export function ChartCard({ title, description, height = '280px', children, chartConfig }: ChartCardProps) {
  if (!children) {
    return (
      <Card className="h-full bg-gray-50 dark:bg-gray-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium dark:text-gray-100">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs text-gray-400 dark:text-gray-500">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full transition-shadow hover:shadow-md dark:hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium dark:text-gray-100">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs text-gray-400 dark:text-gray-500">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-2">
        <ChartContainer config={chartConfig} className={`h-[${height}] w-full text-xs`}>
          {children}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
