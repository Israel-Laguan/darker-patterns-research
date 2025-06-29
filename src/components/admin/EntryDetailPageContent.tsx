'use client';

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { flagDPOEntry } from '@/lib/firestore/mutations/dpo';
import { EntryActions } from './EntryDetail/EntryActions';
import { EntryAnalytics } from './EntryDetail/EntryAnalytics';
import { EntryComments } from './EntryDetail/EntryComments';
import { EntryEvaluations } from './EntryDetail/EntryEvaluations';
import { EntryOriginalData } from './EntryDetail/EntryOriginalData';
import { FlagEntryModal } from './EntryDetail/FlagEntryModal';
import { RevisionInfoBanner } from './EntryDetail/RevisionInfoBanner';
import RemediationBanner from './EntryDetail/RemediationBanner';
import type { EntryDetailPageContentProps } from './EntryDetailPageContent.types';

const EntryDetailPageContent: React.FC<EntryDetailPageContentProps> = ({ entry }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionToRemediate = searchParams.get('remediate');
  const submissionToSuggestEdit = searchParams.get('suggestEdit');
  const { user } = useAuth();
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (submissionToSuggestEdit) {
      router.push(`/admin/entries/${entry.id}/edit?from_submission=${submissionToSuggestEdit}`);
    }
  }, [submissionToSuggestEdit, entry.id, router]);
  const handleEdit = () => {
    router.push(`/admin/entries/${entry.id}/edit`);
  };

  const handleFlag = () => {
    setIsFlagModalOpen(true);
  };

  const handleFlagSubmit = async (reason: string) => {
    if (!user) {
      setMessage('Error: You must be logged in to flag an entry.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const flagData = {
        participantSessionUid: user.uid,
        reason: reason,
        dpoEntryId: entry.id,
        status: 'under_review' as const,
      };

      const result = await flagDPOEntry(entry.id, flagData);

      if (result.success) {
        setMessage('Entry flagged successfully!');
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to flag entry:', error);
      setMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setIsFlagModalOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Details for Entry: {entry.id}</h1>
      {submissionToRemediate && <RemediationBanner submissionId={submissionToRemediate} />}
      <RevisionInfoBanner entry={entry} />

      {message && (
        <div
          className={`mb-4 rounded p-4 ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {message}
        </div>
      )}

      <EntryOriginalData entry={entry} />
      <EntryAnalytics entry={entry} />
      <EntryActions onEdit={handleEdit} onFlag={handleFlag} disabled={isLoading} />
      {entry.comments && <EntryComments comments={entry.comments} />}
      {entry.evaluations && <EntryEvaluations evaluations={entry.evaluations} />}

      <FlagEntryModal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        onSubmit={handleFlagSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default EntryDetailPageContent;
