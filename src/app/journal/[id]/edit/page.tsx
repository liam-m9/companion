'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import MoodPicker from '@/components/journal/MoodPicker';
import CategoryPicker from '@/components/journal/CategoryPicker';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { JournalEntry, Mood, JournalCategory } from '@/types';

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const entryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [category, setCategory] = useState<JournalCategory | null>(null);
  const [incidentDate, setIncidentDate] = useState('');
  const [hadSummary, setHadSummary] = useState(false);

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

      const entry = data as JournalEntry;
      setContent(entry.content);
      setTitle(entry.title || '');
      setMood(entry.mood);
      setCategory(entry.category);
      setIncidentDate(entry.incident_date);
      setHadSummary(!!entry.ai_summary);
      setLoading(false);
    }

    fetchEntry();
  }, [entryId]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please write something before saving.');
      return;
    }

    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({
        content: content.trim(),
        title: title.trim() || null,
        mood,
        category,
        incident_date: incidentDate,
        ai_summary: null,
        ai_summary_generated_at: null,
      })
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (updateError) {
      setError('Failed to save changes. Please try again.');
      setSaving(false);
      return;
    }

    router.push(`/journal/${entryId}`);
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Edit Entry
          </h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
          {hadSummary && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Editing will clear the existing AI summary. You can regenerate it after saving.
              </p>
            </div>
          )}

          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened?"
            className="w-full min-h-[240px] p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Title (optional)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this entry a title..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            <MoodPicker selected={mood} onChange={setMood} />
            <CategoryPicker selected={category} onChange={setCategory} />

            <div>
              <label
                htmlFor="incident-date"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                When did this happen?
              </label>
              <input
                id="incident-date"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href={`/journal/${entryId}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
