'use client';

import { useEffect, useState } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { DPOEntryForm } from '@/components/admin/DPOEntryForm';
import { DPOEntry } from '@/types/dpo';
import { cachedGetDpoEntry } from '@/lib/cache/queries';
import { reviseDpoEntry, updateDPOEntry } from '@/lib/firestore/mutations/dpo';

export default function EditDPOEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const entryId = params.entryId as string;
  const cache = useCache();

  const [entry, setEntry] = useState<DPOEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entryId) {
      cachedGetDpoEntry(entryId, cache)
        .then(({ entry: fetchedEntry }) => {
          if (fetchedEntry) {
            setEntry(fetchedEntry);
          } else {
            // Handle not found
            router.push('/admin/entries');
          }
        })
        .catch((error) => {
          console.error('Failed to fetch DPO entry:', error);
          // Handle error
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [entryId, cache, router]);

  const handleSubmit = async (updatedEntry: Partial<DPOEntry>, isRevision: boolean) => {
    if (!cache) return;
    setIsSubmitting(true);
    try {
      if (isRevision) {
        const submissionId = searchParams.get('from_submission');
        const result = await reviseDpoEntry(entryId, updatedEntry, submissionId ?? undefined);
        if (result.success) {
          alert('Your revision has been submitted for review.');
          router.push('/admin/entries');
        } else {
          throw new Error(result.message);
        }
      } else {
        await updateDPOEntry(entryId, updatedEntry);
        await Promise.all([
          cache.invalidateByPattern(`dpo-entry-${entryId}`),
          cache.invalidateByPattern(`entry-details-${entryId}`),
        ]);
        router.push(`/admin/entries/${entryId}`);
      }
    } catch (error) {
      console.error('Failed to update DPO entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert(`Failed to update DPO entry: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!entry) {
    return <div>Entry not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit DPO Entry</h1>
      <DPOEntryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} entry={entry} />
    </div>
  );
}
