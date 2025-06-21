'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SurveyStatusControlProps {
  isSurveyActive: boolean;
  isAdmin: boolean;
  onToggle: () => void;
}

const SurveyStatusControl: React.FC<SurveyStatusControlProps> = ({ isSurveyActive, isAdmin, onToggle }) => {
  const surveySwitch = (
    <Switch
      id="isSurveyActive"
      checked={isSurveyActive}
      onCheckedChange={onToggle}
      disabled={!isAdmin}
      className="data-[state=checked]:bg-brand-purple-500 data-[state=unchecked]:bg-dark-bg-tertiary"
      thumbClassName="data-[state=checked]:bg-white data-[state=unchecked]:bg-dark-bg-secondary"
    />
  );

  return (
    <div>
      <label htmlFor="isSurveyActive" className="text-dark-text-primary block text-sm font-medium">
        Survey Active
      </label>
      {!isAdmin ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{surveySwitch}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-dark-text-primary">You do not have permission to change the survey status.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        surveySwitch
      )}
    </div>
  );
};

export default SurveyStatusControl;
