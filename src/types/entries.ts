import type { DPOEntry } from './dpo';

export interface DisplayEntry extends Omit<DPOEntry, 'date'> {
  id: string;
  date: string;
  reviewProgress?: number;
  statusText?: string;
}

export type SortableEntryKeys = keyof Pick<DisplayEntry, 'id' | 'categories' | 'reviewCount'>;
