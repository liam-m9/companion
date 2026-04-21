'use client';

import OptionCard from './OptionCard';
import { STAGE_OPTIONS } from '@/lib/onboarding-config';
import type { Stage } from '@/types';

interface StepStageProps {
  value: Stage | '';
  onChange: (value: Stage) => void;
}

export default function StepStage({ value, onChange }: StepStageProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
          Where are you in the process?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          This helps us show you the most relevant information
        </p>
      </div>

      <div className="space-y-3">
        {STAGE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value === option.value}
            onClick={() => onChange(option.value as Stage)}
          />
        ))}
      </div>
    </div>
  );
}
