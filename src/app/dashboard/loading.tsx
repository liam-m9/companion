export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-7 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"
            >
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
