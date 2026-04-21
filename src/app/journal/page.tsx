'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/dashboard/Header';
import Footer from '@/components/dashboard/Footer';
import EntryCard from '@/components/journal/EntryCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MOODS, JOURNAL_CATEGORIES } from '@/types';
import type { JournalEntry } from '@/types';

export default function JournalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodFilter, setMoodFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchEntries() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      let query = supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (moodFilter) {
        query = query.eq('mood', moodFilter);
      }
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      if (search) {
        query = query.ilike('content', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching entries:', error);
      } else {
        setEntries((data as JournalEntry[]) || []);
      }
      setLoading(false);
    }

    fetchEntries();
  }, [moodFilter, categoryFilter, search]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="px-6">
        <section className="max-w-3xl mx-auto pt-16 sm:pt-20 pb-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Journal
            </h1>
            <Link
              href="/journal/new"
              className="inline-flex items-baseline gap-2 text-base font-medium border-b border-zinc-900 dark:border-zinc-100 pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              New entry
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto pb-8 border-t border-zinc-200 dark:border-zinc-900 pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search entries"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            />
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            >
              <option value="">All moods</option>
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            >
              <option value="">All categories</option>
              {JOURNAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="max-w-3xl mx-auto pb-24">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 border-t border-zinc-200 dark:border-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                {search || moodFilter || categoryFilter
                  ? 'No entries match your filters.'
                  : 'No journal entries yet. Start by writing what\'s on your mind.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-900 border-t border-zinc-200 dark:border-zinc-900">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
