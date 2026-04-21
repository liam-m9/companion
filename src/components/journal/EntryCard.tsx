import Link from 'next/link';
import type { JournalEntry } from '@/types';

const MOOD_DOT: Record<string, string> = {
  calm: 'bg-emerald-400',
  anxious: 'bg-yellow-400',
  angry: 'bg-red-400',
  sad: 'bg-blue-400',
  overwhelmed: 'bg-purple-400',
  hopeful: 'bg-teal-400',
  frustrated: 'bg-orange-400',
  relieved: 'bg-emerald-400',
};

interface EntryCardProps {
  entry: JournalEntry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const displayTitle = entry.title || entry.content.slice(0, 60) + (entry.content.length > 60 ? '…' : '');
  const previewContent = entry.content.slice(0, 160) + (entry.content.length > 160 ? '…' : '');
  const formattedDate = new Date(entry.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <li>
      <Link
        href={`/journal/${entry.id}`}
        className="block py-6 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 -mx-4 px-4 transition-colors"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {entry.mood && (
              <span className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    MOOD_DOT[entry.mood] ?? 'bg-zinc-400'
                  }`}
                />
                {entry.mood}
              </span>
            )}
            {entry.mood && entry.category && (
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
            )}
            {entry.category && <span>{entry.category}</span>}
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 shrink-0">
            {formattedDate}
          </div>
        </div>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {displayTitle}
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
          {previewContent}
        </p>
        {entry.ai_summary && (
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            Summary ready
          </p>
        )}
      </Link>
    </li>
  );
}
