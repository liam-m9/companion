'use client';

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  type?: 'radio' | 'checkbox';
}

export default function OptionCard({
  label,
  description,
  selected,
  onClick,
  type = 'radio',
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border text-left transition-all duration-200
        ${selected
          ? 'border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white'
          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center
            ${type === 'radio' ? 'rounded-full' : 'rounded'}
            ${selected
              ? 'border-white dark:border-zinc-900'
              : 'border-zinc-300 dark:border-zinc-600'
            }
          `}
        >
          {selected && (
            type === 'radio' ? (
              <div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-zinc-900" />
            ) : (
              <svg
                className="w-3 h-3 text-white dark:text-zinc-900"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )
          )}
        </div>
        <div>
          <span className={`block font-medium ${selected ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white'}`}>
            {label}
          </span>
          {description && (
            <span className={`block text-sm mt-0.5 ${selected ? 'text-zinc-300 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
              {description}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
