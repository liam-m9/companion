import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="px-6 pt-8 sm:pt-12">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          <span>Companion</span>
          <Link
            href="/login"
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="px-6">
        <section className="max-w-2xl mx-auto pt-24 sm:pt-36 pb-28">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.02]">
            Companion
          </h1>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
            A quiet place to keep track of what&apos;s happening.
          </p>

          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-baseline gap-2 text-lg font-medium border-b border-zinc-900 dark:border-zinc-100 pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              Sign up
              <span aria-hidden className="text-base">→</span>
            </Link>
          </div>
        </section>

        <section className="max-w-2xl mx-auto py-24 border-t border-zinc-200 dark:border-zinc-900">
          <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-[1.8]">
            Keep your journal entries, documents, finances, and timeline in one
            place. When you need a summary for your solicitor, the app
            generates one from everything you&apos;ve logged.
          </p>
        </section>

        <section className="max-w-2xl mx-auto py-24 border-t border-zinc-200 dark:border-zinc-900">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-10">
            An entry
          </p>
          <article className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/40 p-8 sm:p-10">
            <div className="flex items-baseline justify-between gap-4 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
              <span>12 Feb · overwhelmed · legal</span>
              <span>04:41</span>
            </div>
            <h3 className="mt-4 font-serif text-2xl tracking-tight">
              Solicitor meeting. Forms.
            </h3>
            <p className="mt-4 font-serif text-[17px] leading-[1.75] text-zinc-700 dark:text-zinc-300">
              Three hours with Emma today. She asked for statements going back
              two years and I only have fifteen months. Next meeting the 28th.
              Said I need to make a list of everything in the house I think is
              mine and everything I&apos;d fight for. I couldn&apos;t answer
              straight away.
            </p>
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-3">
                Summary
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Met with solicitor Emma. Action items: compile 24 months of
                bank statements (15 currently held); prepare inventory of
                contested household assets. Next meeting 28 Feb.
              </p>
            </div>
          </article>
        </section>

        <section className="max-w-2xl mx-auto py-24 border-t border-zinc-200 dark:border-zinc-900">
          <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-[1.8]">
            Your data is private. Only you can see it.
          </p>
        </section>

        <section className="max-w-2xl mx-auto py-28 border-t border-zinc-200 dark:border-zinc-900">
          <Link
            href="/signup"
            className="inline-flex items-baseline gap-2 text-lg font-medium border-b border-zinc-900 dark:border-zinc-100 pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
          >
            Sign up
            <span aria-hidden className="text-base">→</span>
          </Link>
        </section>
      </main>

      <footer className="px-6 pb-12">
        <div className="max-w-2xl mx-auto pt-8 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          <span>© 2026 Companion</span>
          <Link
            href="/login"
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
