'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import AISummarySection from '@/components/journal/AISummarySection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { JournalEntry } from '@/types';

const MOOD_COLORS: Record<string, string> = {
  calm: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  anxious: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  angry: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  sad: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  overwhelmed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  hopeful: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  frustrated: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  relieved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function EntryPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchEntry() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        router.push('/journal');
        return;
      }

      setEntry(data as JournalEntry);
      setLoading(false);
    }

    fetchEntry();
  }, [entryId]);

  const handleDelete = async () => {
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) {
      setDeleting(false);
      return;
    }

    router.push('/journal');
  };

  const handleSummaryGenerated = (summary: string, generatedAt: string) => {
    if (entry) {
      setEntry({
        ...entry,
        ai_summary: summary,
        ai_summary_generated_at: generatedAt,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!entry) return null;

  const createdDate = new Date(entry.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const incidentDate = new Date(entry.incident_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/journal"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4 inline-block"
        >
          &larr; Back to journal
        </Link>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
          {/* Header */}
          <div className="mb-4">
            {entry.title && (
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                {entry.title}
              </h1>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span>Written {createdDate}</span>
              {entry.incident_date !== entry.created_at.split('T')[0] && (
                <>
                  <span>&middot;</span>
                  <span>Incident: {incidentDate}</span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-6">
            {entry.mood && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${MOOD_COLORS[entry.mood] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
              </span>
            )}
            {entry.category && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium">
                {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-8">
            <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800 mb-8" />

          {/* AI Summary */}
          <AISummarySection
            entryId={entry.id}
            summary={entry.ai_summary}
            generatedAt={entry.ai_summary_generated_at}
            entryTitle={entry.title}
            incidentDate={entry.incident_date}
            onSummaryGenerated={handleSummaryGenerated}
          />

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href={`/journal/${entry.id}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-500">Delete this entry?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={deleting}
                  className="text-red-500 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
                >
                  Yes, delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
