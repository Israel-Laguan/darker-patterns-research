'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AddFirstUpdateBannerProps {
  onAddUpdate: () => void;
  isAdmin: boolean;
}

const AddFirstUpdateBanner: React.FC<AddFirstUpdateBannerProps> = ({ onAddUpdate, isAdmin }) => {
  const bannerContent = (
    <Card className="bg-dark-bg-secondary border-dark-bg-tertiary">
      <CardHeader>
        <CardTitle className="text-dark-text-primary">No Updates Yet!</CardTitle>
        <CardDescription className="text-dark-text-secondary">
          Add a new update to keep your users informed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onAddUpdate}
          disabled={!isAdmin}
          className="bg-brand-purple-500 hover:bg-brand-purple-600 text-white"
        >
          Add First Update
        </Button>
      </CardContent>
    </Card>
  );

  if (!isAdmin) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{bannerContent}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-dark-text-primary">You do not have permission to add updates.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return bannerContent;
};

export default AddFirstUpdateBanner;
