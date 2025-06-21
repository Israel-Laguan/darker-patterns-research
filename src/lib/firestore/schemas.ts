import { Timestamp } from 'firebase/firestore';

export interface Update<T = Timestamp> {
  id: string;
  title: string;
  date: T;
  description: string;
  iconName?: string;
}

export interface GlobalConfig<T = Timestamp> {
  isSurveyActive: boolean;
  targetReviews: number;
  updates: Update<T>[];
}
