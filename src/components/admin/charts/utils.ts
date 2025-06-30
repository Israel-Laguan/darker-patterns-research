// src/components/admin/charts/utils.ts
'use client';

import { chartColors, type ChartConfig, type ChartDataItem, type PieChartData } from '@/types/charts';
import { DemographicsDistribution } from '@/types/stats';

export function transformDistributionData(distribution: DemographicsDistribution | undefined): PieChartData[] {
  if (!distribution) return [];
  return Object.entries(distribution)
    .map(([name, value], index) => ({
      name,
      value,
      fill: chartColors[index % chartColors.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function createChartConfig(data: ChartDataItem[], nameField: string, valueField: string = 'value'): ChartConfig {
  const config: { [key: string]: { label: string; color?: string } } = {
    [valueField]: { label: 'Count', color: '#82ca9d' },
  };
  data.forEach((item) => {
    const key = item[nameField];
    if (key != null) {
      config[String(key)] = { label: String(key), color: item.fill };
    }
  });
  return config;
}

export function transformRatingData(distribution: Record<string, number> | undefined) {
  if (!distribution) return [];
  return Object.entries(distribution)
    .map(([name, value], index) => ({
      name: name.replace('_star', ' Star').replace('star', ' Star'),
      count: value,
      fill: chartColors[index % chartColors.length],
    }))
    .sort((a, b) => parseInt(a.name.split(' ')[0]) - parseInt(b.name.split(' ')[0]));
}

export function createPieChartData(
  value: number | undefined,
  label1: string,
  label2: string,
  color1: string,
  color2: string,
) {
  if (value === undefined) return [];
  return [
    { name: label1, value: value, fill: color1 },
    { name: label2, value: 100 - value, fill: color2 },
  ];
}

export function createPieChartConfig(label1: string, label2: string, color1: string, color2: string): ChartConfig {
  return {
    [label1]: { label: label1, color: color1 },
    [label2]: { label: label2, color: color2 },
  };
}

export function createRatingChartConfig(ratingData: Array<{ name: string; fill: string }>): ChartConfig {
  return {
    count: { label: 'Submissions' },
    ...ratingData.reduce((acc, item) => {
      acc[item.name] = { label: item.name, color: item.fill };
      return acc;
    }, {} as ChartConfig),
  };
}
