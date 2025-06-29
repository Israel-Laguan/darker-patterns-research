'use client';

import EntryDetailPageContent from '@/components/admin/EntryDetailPageContent';
import { useCache } from '@/contexts/CacheContext';
import { cachedGetEntryDetails } from '@/lib/cache/queries';
import { incrementEntryViewCount } from '@/lib/firestore/queries/admin';
import type { EntryWithDetails } from '@/types/entryDetails';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EntryDetailPageViewProps {
  entryId: string;
}

export default function EntryDetailPageView({ entryId }: EntryDetailPageViewProps) {
  const cache = useCache();
  const [entry, setEntry] = useState<EntryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntryData = async () => {
      try {
        setLoading(true);
        // Run these in parallel for better performance
        const [entryData] = await Promise.all([
          // Get entry details first
          cachedGetEntryDetails(entryId, cache),
          // Increment view count (fire and forget)
          incrementEntryViewCount(entryId).catch((err) => {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Error incrementing entry view count:', err);
            }
          }),
        ]);
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('Entry data:', entryData);
        }
        setEntry(entryData);
        setError(null);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error fetching entry details:', err);
        }
        setError('Failed to load entry details.');
      } finally {
        setLoading(false);
      }
    };

    if (entryId) {
      fetchEntryData();
    }
  }, [entryId, cache]);

  if (loading) {
    return <div>Loading entry...</div>;
  }

  if (error) {
    // This will trigger the not-found UI for the route
    return notFound();
  }

  if (!entry) {
    // This can happen if the fetch completes but there's no data
    return notFound();
  }

  return <EntryDetailPageContent entry={entry} />;
}
