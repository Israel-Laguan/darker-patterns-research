/* eslint-disable max-lines-per-function */
// components/survey/EntryReviewStepContent.tsx
'use client';
import { useState } from 'react';
import { useSurveyProgress } from '../../contexts/SurveyProgressContext';
import EntryReviewStepContentView from './EntryReviewStepContentView';
import { buildEvaluationDraft } from './evaluationUtils';
import { submitFlagForEntry } from './flagUtils';
import { useEntryReviewState } from './useEntryReviewState';

const EntryReviewStepContent: React.FC = () => {
  const {
    currentStepNumber,
    totalSteps,
    submitEvaluation: submitEvaluationToContext,
    dpoEntriesToReview,
    currentDpoEntryIndex,
    isLoadingEntries,
    participantSessionUid,
    markCurrentEvaluationSubmitted,
    isCurrentEvaluationSubmitted,
    error: contextError,
  } = useSurveyProgress();

  const {
    currentDisplayEntry,
    optionAContent,
    optionBContent,
    optionAisDPOAccepted,
    selectedOptionKey,
    setSelectedOptionKey,
    userRating,
    setUserRating,
    userComment,
    setUserComment,
    selectedCategories,
    setSelectedCategories,
    timeStarted,
    localError,
    setLocalError,
  } = useEntryReviewState();

  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  const handleOptionSelect = (optionKey: 'A' | 'B') => {
    if (isCurrentEvaluationSubmitted) return;
    setSelectedOptionKey(optionKey);
    setLocalError(null);
  };

  const handleLocalSubmitAndReveal = () => {
    setLocalError(null);
    const result = buildEvaluationDraft({
      currentDisplayEntry,
      selectedOptionKey,
      userRating,
      userComment,
      timeStarted,
      optionAisDPOAccepted,
      selectedCategories,
    });
    if (typeof result === 'string') {
      setLocalError(result);
      return;
    }
    const currentEntry = dpoEntriesToReview[currentDpoEntryIndex];
    if (!currentEntry) {
      setLocalError('No current entry to submit evaluation for.');
      return;
    }
    submitEvaluationToContext(result, currentEntry);
    markCurrentEvaluationSubmitted();
  };

  const handleSubmitFlag = async (reason: string, comment: string) => {
    if (!participantSessionUid) {
      alert('Cannot submit flag: missing session information.');
      setIsFlagModalOpen(false);
      return;
    }
    await submitFlagForEntry({
      currentDisplayEntry,
      participantSessionUid,
      reason,
      comment,
      onFinally: () => setIsFlagModalOpen(false),
    });
  };

  const canSubmitLocal: boolean = Boolean(selectedOptionKey && userRating > 0);
  const userChoseCorrectlyIfRevealed =
    isCurrentEvaluationSubmitted &&
    ((selectedOptionKey === 'A' && optionAisDPOAccepted) || (selectedOptionKey === 'B' && !optionAisDPOAccepted));

  return (
    <EntryReviewStepContentView
      currentDisplayEntry={currentDisplayEntry}
      currentDpoEntryIndex={currentDpoEntryIndex}
      dpoEntriesToReview={dpoEntriesToReview}
      currentStepNumber={currentStepNumber}
      totalSteps={totalSteps}
      isLoadingEntries={isLoadingEntries}
      isCurrentEvaluationSubmitted={isCurrentEvaluationSubmitted}
      selectedOptionKey={selectedOptionKey}
      userRating={userRating}
      userComment={userComment}
      selectedCategories={selectedCategories}
      localError={localError}
      contextError={contextError}
      isFlagModalOpen={isFlagModalOpen}
      canSubmitLocal={canSubmitLocal}
      userChoseCorrectlyIfRevealed={userChoseCorrectlyIfRevealed}
      optionAContent={optionAContent}
      optionBContent={optionBContent}
      optionAisDPOAccepted={optionAisDPOAccepted}
      handleOptionSelect={handleOptionSelect}
      setUserRating={setUserRating}
      setUserComment={setUserComment}
      setSelectedCategories={setSelectedCategories}
      handleLocalSubmitAndReveal={handleLocalSubmitAndReveal}
      setIsFlagModalOpen={setIsFlagModalOpen}
      handleSubmitFlag={handleSubmitFlag}
    />
  );
};

export default EntryReviewStepContent;
