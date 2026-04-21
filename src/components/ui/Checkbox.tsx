'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <label
        htmlFor={checkboxId}
        className={`
          flex items-start gap-3 p-4 rounded-lg border cursor-pointer
          border-zinc-200 dark:border-zinc-700
          hover:border-zinc-300 dark:hover:border-zinc-600
          has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50
          dark:has-[:checked]:border-white dark:has-[:checked]:bg-zinc-800
          transition-colors
          ${className}
        `}
      >
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
          {...props}
        />
        <div>
          <span className="block font-medium text-zinc-900 dark:text-white">
            {label}
          </span>
          {description && (
            <span className="block text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
