'use client';

import { useEffect, useState } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { cachedGetSubmissionById } from '@/lib/cache/queries';
import type { DisplaySubmission } from '@/types/submissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RemediationBannerProps {
  submissionId: string;
}

export default function RemediationBanner({ submissionId }: RemediationBannerProps) {
  const cache = useCache();
  const [submission, setSubmission] = useState<DisplaySubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const sub = await cachedGetSubmissionById(submissionId, cache);
        if (sub) {
          setSubmission(sub);
        } else {
          setError('Submission not found.');
        }
      } catch (err) {
        setError('Failed to fetch submission details.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmission();
  }, [submissionId, cache]);

  if (isLoading) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Loading Submission Details...</AlertTitle>
        <AlertDescription>
          <Skeleton className="h-4 w-3/4" />
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-500 text-yellow-700">
      <AlertCircle className="h-4 w-4 text-yellow-500" />
      <AlertTitle className="font-bold">Remediation in Progress</AlertTitle>
      <AlertDescription>
        <p>This entry is under review based on the following submission:</p>
        <blockquote className="mt-2 border-l-2 border-yellow-400 pl-4 italic">
          <p>
            <strong>Reason:</strong> {submission.reason}
          </p>
          {submission.comment && (
            <p>
              <strong>Comment:</strong> {submission.comment}
            </p>
          )}
        </blockquote>
      </AlertDescription>
    </Alert>
  );
}
