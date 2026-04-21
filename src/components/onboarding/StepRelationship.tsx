'use client';

import OptionCard from './OptionCard';
import { RELATIONSHIP_TYPE_OPTIONS } from '@/lib/onboarding-config';
import type { RelationshipType } from '@/types';

interface StepRelationshipProps {
  value: RelationshipType | '';
  onChange: (value: RelationshipType) => void;
}

export default function StepRelationship({ value, onChange }: StepRelationshipProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
          What is your relationship status?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Select the option that best describes your situation
        </p>
      </div>

      <div className="space-y-3">
        {RELATIONSHIP_TYPE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value === option.value}
            onClick={() => onChange(option.value as RelationshipType)}
          />
        ))}
      </div>
    </div>
  );
}
