'use client';

import { JOURNAL_CATEGORIES } from '@/types';
import type { JournalCategory } from '@/types';

interface CategoryPickerProps {
  selected: JournalCategory | null;
  onChange: (category: JournalCategory | null) => void;
}

export default function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Category
      </label>
      <div className="flex flex-wrap gap-2">
        {JOURNAL_CATEGORIES.map((category) => {
          const isActive = selected === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(isActive ? null : category)}
              className={`px-3 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
