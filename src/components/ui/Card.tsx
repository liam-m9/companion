interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-zinc-900
        border border-zinc-200 dark:border-zinc-800
        rounded-xl shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}
