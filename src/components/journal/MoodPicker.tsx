'use client';

import { MOODS } from '@/types';
import type { Mood } from '@/types';

const MOOD_COLORS: Record<string, { active: string; inactive: string }> = {
  calm: {
    active: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-green-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-green-700',
  },
  anxious: {
    active: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-yellow-700',
  },
  angry: {
    active: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-red-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-red-700',
  },
  sad: {
    active: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-blue-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-blue-700',
  },
  overwhelmed: {
    active: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-purple-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-purple-700',
  },
  hopeful: {
    active: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-teal-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-teal-700',
  },
  frustrated: {
    active: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-orange-700',
  },
  relieved: {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
    inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-emerald-700',
  },
};

interface MoodPickerProps {
  selected: Mood | null;
  onChange: (mood: Mood | null) => void;
}

export default function MoodPicker({ selected, onChange }: MoodPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Mood
      </label>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((mood) => {
          const isActive = selected === mood;
          const colors = MOOD_COLORS[mood];
          return (
            <button
              key={mood}
              type="button"
              onClick={() => onChange(isActive ? null : mood)}
              className={`px-3 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                isActive ? colors.active : colors.inactive
              }`}
            >
              {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
