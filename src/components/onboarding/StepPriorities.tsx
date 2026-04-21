'use client';

import OptionCard from './OptionCard';
import { PRIORITY_OPTIONS } from '@/lib/onboarding-config';
import type { Priority } from '@/types';

interface StepPrioritiesProps {
  value: Priority[];
  onChange: (value: Priority[]) => void;
}

export default function StepPriorities({ value, onChange }: StepPrioritiesProps) {
  const togglePriority = (priority: Priority) => {
    if (value.includes(priority)) {
      onChange(value.filter((p) => p !== priority));
    } else {
      onChange([...value, priority]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
          What matters most to you right now?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Select all that apply
        </p>
      </div>

      <div className="space-y-3">
        {PRIORITY_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value.includes(option.value as Priority)}
            onClick={() => togglePriority(option.value as Priority)}
            type="checkbox"
          />
        ))}
      </div>
    </div>
  );
}
