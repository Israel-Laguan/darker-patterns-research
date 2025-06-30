// src/types/charts.ts
import type { ChartConfig } from '@/components/ui/chart.types';
import type React from 'react';

export type { ChartConfig }; // Re-exporting

export const chartColors = [
  '#4f46e5', // indigo-600
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
];

export interface ChartDataItem {
  name: string;
  fill: string;
  [key: string]: string | number | undefined;
}

export interface PieChartData extends ChartDataItem {
  value: number;
}

export interface BarChartData extends ChartDataItem {
  count: number;
}

export interface ChartCardBaseProps {
  title: string;
  description?: string;
  chartConfig: ChartConfig;
}

export interface DemographicsBarChartProps extends ChartCardBaseProps {
  data: BarChartData[];
  dataKey: string;
  barDataKey?: string;
  layout?: 'horizontal' | 'vertical';
}

export interface PieChartCardProps extends ChartCardBaseProps {
  data: PieChartData[];
}

export interface ChartCardProps extends ChartCardBaseProps {
  height?: string;
  children?: React.ReactElement;
}
