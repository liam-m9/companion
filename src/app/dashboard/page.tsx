import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';
import { getCurrencyConfig } from '@/lib/currency';
import Header from '@/components/dashboard/Header';
import Footer from '@/components/dashboard/Footer';

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  legal: 'Legal',
  financial: 'Financial',
  personal: 'Personal',
  correspondence: 'Correspondence',
  court: 'Court',
  other: 'Other',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (!profile.onboarding_completed) redirect('/onboarding');

  const typedProfile = profile as Profile;

  const [journalRes, docsRes, timelineRes, financeRes] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('id, title, content, created_at, ai_summary')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('documents')
      .select('id, file_name, category, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(1),
    supabase
      .from('timeline_events')
      .select('id, title, event_date')
      .order('event_date', { ascending: false })
      .limit(1),
    supabase
      .from('financial_items')
      .select('id, type, amount'),
  ]);

  const [journalCount, docsCount, timelineCount, financeCount] = await Promise.all([
    supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('timeline_events').select('id', { count: 'exact', head: true }),
    supabase.from('financial_items').select('id', { count: 'exact', head: true }),
  ]);

  const counts = {
    journal: journalCount.count ?? 0,
    docs: docsCount.count ?? 0,
    timeline: timelineCount.count ?? 0,
    finance: financeCount.count ?? 0,
  };
  const totalItems = counts.journal + counts.docs + counts.timeline + counts.finance;

  const latestJournal = journalRes.data?.[0] ?? null;
  const latestDoc = docsRes.data?.[0] ?? null;
  const latestEvent = timelineRes.data?.[0] ?? null;

  const financeItems = financeRes.data ?? [];
  const assets = financeItems
    .filter((i) => i.type === 'asset')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const debts = financeItems
    .filter((i) => i.type === 'debt')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const hasAssetsOrDebts = financeItems.some((i) => i.type === 'asset' || i.type === 'debt');
  const netWorth = assets - debts;

  const currency = getCurrencyConfig(typedProfile.country);
  const formatMoney = (n: number) =>
    new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.currency,
      maximumFractionDigits: 0,
    }).format(n);

  const greeting = typedProfile.display_name
    ? `Welcome back, ${typedProfile.display_name}.`
    : 'Welcome back.';

  const journalPreview = latestJournal
    ? (latestJournal.title?.trim() || latestJournal.content?.trim().split('\n')[0] || 'Untitled entry')
    : null;

  const hasActivity = !!(latestJournal || latestDoc || latestEvent || hasAssetsOrDebts);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="px-6">
        <section className="max-w-3xl mx-auto pt-16 sm:pt-20 pb-16">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            {greeting}
          </h1>
        </section>

        {totalItems > 0 && (
          <section className="max-w-3xl mx-auto py-12 border-t border-zinc-200 dark:border-zinc-900">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8">
              <Stat label="Journal entries" count={counts.journal} href="/journal" />
              <Stat label="Documents" count={counts.docs} href="/vault" />
              <Stat label="Timeline events" count={counts.timeline} href="/timeline" />
              <Stat label="Financial items" count={counts.finance} href="/finances" />
            </div>
          </section>
        )}

        {hasActivity && (
          <section className="max-w-3xl mx-auto py-16 border-t border-zinc-200 dark:border-zinc-900">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-8">
              Recent
            </p>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-900 border-t border-zinc-200 dark:border-zinc-900">
              {latestJournal && (
                <ActivityRow
                  meta="Latest journal entry"
                  title={journalPreview!}
                  right={formatDate(latestJournal.created_at)}
                  rightSub={latestJournal.ai_summary ? 'Summary ready' : 'No summary yet'}
                  href={`/journal/${latestJournal.id}`}
                />
              )}
              {latestDoc && (
                <ActivityRow
                  meta="Latest document"
                  title={latestDoc.file_name}
                  right={
                    latestDoc.category
                      ? DOCUMENT_CATEGORY_LABELS[latestDoc.category] ?? latestDoc.category
                      : 'Uncategorised'
                  }
                  href="/vault"
                />
              )}
              {latestEvent && (
                <ActivityRow
                  meta="Latest timeline event"
                  title={latestEvent.title}
                  right={formatDate(latestEvent.event_date)}
                  href="/timeline"
                />
              )}
              {hasAssetsOrDebts && (
                <ActivityRow
                  meta="Net worth"
                  title={formatMoney(netWorth)}
                  right={`${formatMoney(assets)} assets · ${formatMoney(debts)} debts`}
                  href="/finances"
                />
              )}
            </ul>
          </section>
        )}

        {totalItems > 0 && (
          <section className="max-w-3xl mx-auto py-16 border-t border-zinc-200 dark:border-zinc-900">
            <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-[1.7]">
              You have{' '}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>{' '}
              across your account.
            </p>
            <div className="mt-6">
              <Link
                href="/brief"
                className="inline-flex items-baseline gap-2 text-base font-medium border-b border-zinc-900 dark:border-zinc-100 pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
              >
                Generate a brief for your solicitor
                <span aria-hidden>→</span>
              </Link>
            </div>
          </section>
        )}

        {totalItems === 0 && (
          <section className="max-w-3xl mx-auto py-16 border-t border-zinc-200 dark:border-zinc-900">
            <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-[1.7]">
              Nothing here yet. Start with a{' '}
              <Link
                href="/journal/new"
                className="border-b border-zinc-900 dark:border-zinc-100 pb-0.5 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
              >
                journal entry
              </Link>
              , upload a document, or log a timeline event.
            </p>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Stat({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link href={href} className="block group">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
        {label}
      </p>
      <p className="text-5xl sm:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
        {count}
      </p>
    </Link>
  );
}

function ActivityRow({
  meta,
  title,
  right,
  rightSub,
  href,
}: {
  meta: string;
  title: string;
  right: string;
  rightSub?: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-4 py-4 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 -mx-4 px-4 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {meta}
          </p>
          <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{right}</p>
          {rightSub && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{rightSub}</p>
          )}
        </div>
      </Link>
    </li>
  );
}
