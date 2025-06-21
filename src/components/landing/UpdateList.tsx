'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import UpdateItem from './UpdateItem';

// Assuming the same interfaces and iconMap from the parent
import { BarChartBig, CalendarDays, Milestone, Newspaper, Users2 } from 'lucide-react';
import type { LandingUpdate } from './types';

const iconMap: { [key: string]: React.ElementType } = {
  BarChartBig: BarChartBig,
  Milestone: Milestone,
  Users2: Users2,
  Newspaper: Newspaper,
  default: CalendarDays,
};

const UPDATES_THRESHOLD = 5;

interface UpdateListProps {
  updates: LandingUpdate[];
}

const UpdateList: React.FC<UpdateListProps> = ({ updates }) => {
  const [showAll, setShowAll] = useState(false);

  const displayedUpdates = showAll ? updates : updates.slice(0, UPDATES_THRESHOLD);

  return (
    <div>
      <div className="space-y-8 sm:space-y-10">
        {displayedUpdates.map((update, index) => {
          const IconComponent = update.iconName ? iconMap[update.iconName] || iconMap['default'] : iconMap['default'];
          return (
            <UpdateItem
              key={update.id || update.title}
              title={update.title}
              date={update.date}
              description={update.description}
              icon={<IconComponent size={14} />}
              animationDelay={`${index * 100}ms`}
            />
          );
        })}
      </div>
      {updates.length > UPDATES_THRESHOLD && (
        <div className="mt-10 text-center">
          <Button variant="outline" onClick={() => setShowAll(!showAll)} className="btn-secondary-dark">
            {showAll ? 'Show Less' : 'Show All Updates'}
            {showAll ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UpdateList;
