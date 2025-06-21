'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

interface TargetReviewsControlProps {
  targetReviews: number;
  isAdmin: boolean;
  onChange: (value: number) => void;
}

const TargetReviewsControl: React.FC<TargetReviewsControlProps> = ({ targetReviews, isAdmin, onChange }) => {
  return (
    <div>
      <label htmlFor="targetReviews" className="block text-sm font-medium">
        Target Reviews per Entry
      </label>
      <Input
        id="targetReviews"
        type="number"
        value={targetReviews}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={!isAdmin}
      />
    </div>
  );
};

export default TargetReviewsControl;
