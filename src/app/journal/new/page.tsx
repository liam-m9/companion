'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import MoodPicker from '@/components/journal/MoodPicker';
import CategoryPicker from '@/components/journal/CategoryPicker';
import type { Mood, JournalCategory } from '@/types';

const DRAFT_KEY = 'companion-journal-draft';

const WRITING_PROMPTS = [
  'What happened today that\'s on your mind?',
  'How did a conversation with your ex go?',
  'What are you worried about right now?',
  'Something the kids said or did that affected you',
  'A decision you\'re struggling with',
  'How you\'re feeling about the legal process',
  'Something positive that happened today',
  'What you wish you could tell someone',
];

interface Draft {
  content: string;
  title: string;
  mood: Mood | null;
  category: JournalCategory | null;
  incidentDate: string;
  savedAt: number;
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    // Discard drafts older than 7 days
    if (Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export default function NewEntryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [category, setCategory] = useState<JournalCategory | null>(null);
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftFound, setDraftFound] = useState(false);

  // Auto-save debounce ref
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedDraft = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.content || draft.title)) {
      setDraftFound(true);
    }
    hasLoadedDraft.current = true;
  }, []);

  // Auto-save to localStorage (debounced 1s)
  const saveDraft = useCallback(() => {
    if (!hasLoadedDraft.current) return;
    const draft: Draft = {
      content,
      title,
      mood,
      category,
      incidentDate,
      savedAt: Date.now(),
    };
    // Only save if there's actual content
    if (content.trim() || title.trim()) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [content, title, mood, category, incidentDate]);

  useEffect(() => {
    if (!hasLoadedDraft.current || draftFound) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDraft, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [saveDraft, draftFound]);

  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setContent(draft.content);
      setTitle(draft.title);
      setMood(draft.mood);
      setCategory(draft.category);
      setIncidentDate(draft.incidentDate);
      if (draft.title || draft.mood || draft.category) {
        setShowDetails(true);
      }
    }
    setDraftFound(false);
  };

  const discardDraft = () => {
    clearDraft();
    setDraftFound(false);
  };

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

    const { data, error: insertError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        content: content.trim(),
        title: title.trim() || null,
        mood,
        category,
        incident_date: incidentDate,
      })
      .select('id')
      .single();

    if (insertError) {
      setError(`Failed to save entry: ${insertError.message}`);
      setSaving(false);
      return;
    }

    clearDraft();
    router.push(`/journal/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            New Entry
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Write freely. Don&apos;t worry about grammar or structure.
          </p>
        </div>

        {draftFound && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You have an unsaved draft from a previous session.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened? Write everything — raw, messy, emotional. You can clean it up later..."
            className="w-full min-h-[160px] sm:min-h-[240px] p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          />

          {!content.trim() && (
            <div className="mt-3">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-2">Not sure where to start? Try one of these:</p>
              <div className="flex flex-wrap" style={{ gap: '0.5rem' }}>
                {WRITING_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setContent(prompt + '\n\n')}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          {/* Collapsible details section */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              {showDetails ? '- Hide details' : '+ Add details (title, mood, category, date)'}
            </button>

            {showDetails && (
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
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href="/journal">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} isLoading={saving}>
              Save Entry
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
