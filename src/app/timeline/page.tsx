'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/dashboard/Header';
import Footer from '@/components/dashboard/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { TIMELINE_CATEGORIES } from '@/types';
import type { TimelineEvent, TimelineCategory } from '@/types';

const CATEGORY_LABELS: Record<TimelineCategory, string> = {
  legal: 'Legal',
  financial: 'Financial',
  personal: 'Personal',
  emotional: 'Emotional',
  children: 'Children',
};

const CATEGORY_DOT: Record<TimelineCategory, string> = {
  legal: 'bg-purple-400',
  financial: 'bg-emerald-400',
  personal: 'bg-blue-400',
  emotional: 'bg-rose-400',
  children: 'bg-amber-400',
};

const inputClass =
  'w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors';

export default function TimelinePage() {
  const router = useRouter();
  const supabase = createClient();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<TimelineCategory | ''>('');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory] = useState<TimelineCategory | ''>('');

  useEffect(() => {
    fetchEvents();
  }, [categoryFilter, search]);

  async function fetchEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let query = supabase
      .from('timeline_events')
      .select('*')
      .order('event_date', { ascending: false });

    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching timeline events:', error);
    } else {
      setEvents((data as TimelineEvent[]) || []);
    }
    setLoading(false);
  }

  async function handleAdd() {
    if (!newTitle.trim()) {
      setError('Title is required.');
      return;
    }
    if (!newDate) {
      setError('Date is required.');
      return;
    }

    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error: insertError } = await supabase
      .from('timeline_events')
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        event_date: newDate,
        category: newCategory || null,
      });

    if (insertError) {
      console.error('Failed to save:', insertError);
      setError('Failed to save. Please try again.');
      setSaving(false);
      return;
    }

    setNewTitle('');
    setNewDescription('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewCategory('');
    setShowAddForm(false);
    setSaving(false);
    fetchEvents();
  }

  async function handleDelete(eventId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('timeline_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);

    fetchEvents();
  }

  async function handleUpdate(
    eventId: string,
    updates: Partial<Pick<TimelineEvent, 'title' | 'description' | 'event_date' | 'category'>>
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('timeline_events')
      .update(updates)
      .eq('id', eventId)
      .eq('user_id', user.id);

    fetchEvents();
  }

  const groupedByYear: Record<string, TimelineEvent[]> = {};
  events.forEach((event) => {
    const year = new Date(event.event_date).getFullYear().toString();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(event);
  });

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="px-6">
        <section className="max-w-3xl mx-auto pt-16 sm:pt-20 pb-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Timeline
            </h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-baseline gap-2 text-base font-medium border-b border-zinc-900 dark:border-zinc-100 pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add event'}
              {!showAddForm && <span aria-hidden>→</span>}
            </button>
          </div>
        </section>

        {showAddForm && (
          <section className="max-w-3xl mx-auto pb-10 border-t border-zinc-200 dark:border-zinc-900 pt-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  What happened?
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Filed for divorce, Custody hearing, Moved out"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  When
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-3">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIMELINE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewCategory(newCategory === cat ? '' : cat)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs uppercase tracking-[0.18em] transition-colors border ${
                        newCategory === cat
                          ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[cat]}`} />
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  Details (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Any extra context…"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save event'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                  }}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="max-w-3xl mx-auto pb-8 border-t border-zinc-200 dark:border-zinc-900 pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TimelineCategory | '')}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            >
              <option value="">All categories</option>
              {TIMELINE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <section className="max-w-3xl mx-auto pb-24">
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          </section>
        ) : events.length === 0 ? (
          <section className="max-w-3xl mx-auto pb-24">
            <div className="py-16 border-t border-zinc-200 dark:border-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                {categoryFilter || search ? 'No events match your search.' : 'No timeline events yet.'}
              </p>
            </div>
          </section>
        ) : (
          sortedYears.map((year) => (
            <section key={year} className="max-w-3xl mx-auto pb-12">
              <div className="flex items-baseline gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-900">
                <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {year}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                  {groupedByYear[year].length} event
                  {groupedByYear[year].length !== 1 ? 's' : ''}
                </p>
              </div>
              <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-900">
                {groupedByYear[year].map((event) => (
                  <TimelineEventRow
                    key={event.id}
                    event={event}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </main>

      <Footer />
    </div>
  );
}

function TimelineEventRow({
  event,
  onDelete,
  onUpdate,
}: {
  event: TimelineEvent;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<Pick<TimelineEvent, 'title' | 'description' | 'event_date' | 'category'>>
  ) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDescription, setEditDescription] = useState(event.description || '');
  const [editDate, setEditDate] = useState(event.event_date);
  const [editCategory, setEditCategory] = useState<TimelineCategory | ''>(event.category || '');

  const eventDate = new Date(event.event_date + 'T00:00:00');
  const formattedDate = eventDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isFuture = eventDate > new Date();

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    if (!editDate) return;

    onUpdate(event.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      event_date: editDate,
      category: editCategory || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="py-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Date
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-3">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMELINE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEditCategory(editCategory === cat ? '' : cat)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs uppercase tracking-[0.18em] transition-colors border ${
                    editCategory === cat
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[cat]}`} />
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Details
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 pt-1">
            <button
              onClick={handleSaveEdit}
              className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {event.category && (
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[event.category]}`} />
                {CATEGORY_LABELS[event.category]}
              </span>
            )}
            {isFuture && (
              <>
                {event.category && <span className="text-zinc-300 dark:text-zinc-700">·</span>}
                <span className="text-zinc-700 dark:text-zinc-300">Upcoming</span>
              </>
            )}
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {formattedDate}
          </span>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            <button
              onClick={() => setEditing(true)}
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Edit
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onDelete(event.id);
                    setConfirmDelete(false);
                  }}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
