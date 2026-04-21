'use client';

import OptionCard from './OptionCard';
import Input from '@/components/ui/Input';

interface StepChildrenProps {
  hasChildren: boolean | null;
  childrenCount: number | null;
  childrenAges: string;
  onHasChildrenChange: (value: boolean) => void;
  onChildrenCountChange: (value: number | null) => void;
  onChildrenAgesChange: (value: string) => void;
}

export default function StepChildren({
  hasChildren,
  childrenCount,
  childrenAges,
  onHasChildrenChange,
  onChildrenCountChange,
  onChildrenAgesChange,
}: StepChildrenProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
          Do you have children?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          This helps us show relevant parenting resources
        </p>
      </div>

      <div className="space-y-3">
        <OptionCard
          label="Yes"
          selected={hasChildren === true}
          onClick={() => onHasChildrenChange(true)}
        />
        <OptionCard
          label="No"
          selected={hasChildren === false}
          onClick={() => onHasChildrenChange(false)}
        />
      </div>

      {hasChildren && (
        <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <Input
            label="How many children?"
            type="number"
            min={1}
            max={20}
            value={childrenCount ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onChildrenCountChange(val ? parseInt(val, 10) : null);
            }}
            placeholder="Enter number"
          />
          <Input
            label="What are their ages? (optional)"
            type="text"
            value={childrenAges}
            onChange={(e) => onChildrenAgesChange(e.target.value)}
            placeholder="e.g., 5, 8, 12"
          />
        </div>
      )}
    </div>
  );
}
