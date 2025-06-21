'use client';

import React from 'react';
import AddFirstUpdateBanner from './AddFirstUpdateBanner';
import UpdatesManager from './UpdatesManager';
import { Update } from '@/lib/firestore/schemas';

interface UpdatesSectionProps {
  updates: Update<Date>[];
  isAdmin: boolean;
  onAddUpdate: () => void;
  onUpdateChange: (updates: Update<Date>[]) => void;
}

const UpdatesSection: React.FC<UpdatesSectionProps> = ({ updates, isAdmin, onAddUpdate, onUpdateChange }) => {
  return (
    <>
      {updates.length === 0 ? (
        <AddFirstUpdateBanner onAddUpdate={onAddUpdate} isAdmin={isAdmin} />
      ) : (
        <UpdatesManager updates={updates} onUpdateChange={onUpdateChange} />
      )}
    </>
  );
};

export default UpdatesSection;
