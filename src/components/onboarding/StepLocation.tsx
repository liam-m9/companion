'use client';

import Select from '@/components/ui/Select';
import { COUNTRY_OPTIONS } from '@/lib/onboarding-config';

interface StepLocationProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StepLocation({ value, onChange }: StepLocationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
          Where do you currently live?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          This helps us provide relevant information for your location
        </p>
      </div>

      <Select
        options={[...COUNTRY_OPTIONS]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select your country"
        className="text-lg py-3"
      />
    </div>
  );
}
