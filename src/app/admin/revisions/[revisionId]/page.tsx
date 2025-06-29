import { cachedGetRevisionById } from '@/lib/cache/queries';
import { cachedGetDpoEntry } from '@/lib/cache/queries';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RevisionActions from './RevisionActions';
import type { DPOEntry } from '@/types/dpo';
import { Metadata } from 'next';

type PageProps = {
  params: {
    revisionId: string;
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Review Revision ${params.revisionId} - DPV Admin`,
  };
}

const DiffViewer = ({ original, revised }: { original: DPOEntry; revised: Partial<DPOEntry> }) => {
  const changedKeys = Object.keys(revised);

  return (
    <div className="grid grid-cols-1 gap-6 font-mono text-sm md:grid-cols-2">
      <div>
        <h3 className="mb-2 border-b pb-1 font-sans text-lg font-bold">Original</h3>
        {changedKeys.map((key) => (
          <div key={key} className="mb-4">
            <p className="font-semibold text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
            <pre className="rounded bg-gray-100 p-2 whitespace-pre-wrap text-gray-800">
              {String(original[key as keyof DPOEntry] ?? 'N/A')}
            </pre>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 border-b pb-1 font-sans text-lg font-bold">Proposed Changes</h3>
        {changedKeys.map((key) => {
          const originalValue = String(original[key as keyof DPOEntry] ?? 'N/A');
          const revisedValue = String(revised[key as keyof DPOEntry] ?? 'N/A');
          const isChanged = originalValue !== revisedValue;
          return (
            <div key={key} className="mb-4">
              <p className="font-semibold text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              <pre
                className={`rounded p-2 whitespace-pre-wrap ${isChanged ? 'bg-yellow-100 ring-2 ring-yellow-300' : 'bg-gray-100'}`}
              >
                {revisedValue}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default async function RevisionDetailPage({ params }: PageProps) {
  const { revisionId } = params;
  const revision = await cachedGetRevisionById(revisionId);

  if (!revision) {
    notFound();
  }

  const { entry: originalEntry } = await cachedGetDpoEntry(revision.originalEntryId);

  if (!originalEntry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Error</h1>
        <p>Original entry with ID {revision.originalEntryId} not found. It may have been deleted.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Review Revision</h1>
      <Card>
        <CardHeader>
          <CardTitle>Comparing Changes for Entry: {revision.originalEntryId}</CardTitle>
        </CardHeader>
        <CardContent>
          <DiffViewer original={originalEntry} revised={revision.proposedChanges} />
          <RevisionActions
            revisionId={revision.id}
            originalEntryId={revision.originalEntryId}
            submissionId={revision.submissionId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
