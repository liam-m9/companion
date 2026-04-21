'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/dashboard/Header';
import Footer from '@/components/dashboard/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FINANCIAL_TYPES, FREQUENCY_OPTIONS } from '@/types';
import type { FinancialItem, FinancialType, Frequency } from '@/types';
import { getCurrencyConfig, type CurrencyConfig } from '@/lib/currency';

const TYPE_LABELS: Record<FinancialType, string> = {
  asset: 'Asset',
  debt: 'Debt',
  income: 'Income',
  expense: 'Expense',
};

const FREQUENCY_LABELS: Record<Frequency, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  annually: 'Annually',
};

const FREQUENCY_SUFFIX: Record<Frequency, string> = {
  one_time: 'one-time',
  monthly: '/ month',
  annually: '/ year',
};

const inputClass =
  'w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors';

export default function FinancesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<FinancialType | ''>('');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(getCurrencyConfig(null));

  const [newType, setNewType] = useState<FinancialType>('asset');
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState<Frequency | ''>('');
  const [newNotes, setNewNotes] = useState('');

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      if (data?.country) {
        setCurrencyConfig(getCurrencyConfig(data.country));
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [typeFilter, search]);

  async function fetchItems() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let query = supabase
      .from('financial_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching financial items:', error);
    } else {
      setItems((data as FinancialItem[]) || []);
    }
    setLoading(false);
  }

  async function handleAdd() {
    if (!newName.trim()) {
      setError('Name is required.');
      return;
    }
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error: insertError } = await supabase
      .from('financial_items')
      .insert({
        user_id: user.id,
        type: newType,
        name: newName.trim(),
        amount,
        frequency:
          newType === 'income' || newType === 'expense' ? newFrequency || null : null,
        notes: newNotes.trim() || null,
      });

    if (insertError) {
      console.error('Failed to save:', insertError);
      setError('Failed to save. Please try again.');
      setSaving(false);
      return;
    }

    setNewType('asset');
    setNewName('');
    setNewAmount('');
    setNewFrequency('');
    setNewNotes('');
    setShowAddForm(false);
    setSaving(false);
    fetchItems();
  }

  async function handleDelete(itemId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('financial_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    fetchItems();
  }

  async function handleUpdate(
    itemId: string,
    updates: Partial<Pick<FinancialItem, 'type' | 'name' | 'amount' | 'frequency' | 'notes'>>
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('financial_items')
      .update(updates)
      .eq('id', itemId)
      .eq('user_id', user.id);

    fetchItems();
  }

  const totalAssets = items
    .filter((i) => i.type === 'asset')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalDebts = items
    .filter((i) => i.type === 'debt')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const netWorth = totalAssets - totalDebts;
  const monthlyIncome = items
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => {
      const amt = Number(i.amount);
      if (i.frequency === 'annually') return sum + amt / 12;
      if (i.frequency === 'monthly') return sum + amt;
      return sum + amt;
    }, 0);
  const monthlyExpenses = items
    .filter((i) => i.type === 'expense')
    .reduce((sum, i) => {
      const amt = Number(i.amount);
      if (i.frequency === 'annually') return sum + amt / 12;
      if (i.frequency === 'monthly') return sum + amt;
      return sum + amt;
    }, 0);
  const monthlyNet = monthlyIncome - monthlyExpenses;

  const showSummary = !loading && items.length > 0 && !typeFilter && !search;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="px-6">
        <section className="max-w-3xl mx-auto pt-16 sm:pt-20 pb-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Finances
            </h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-baseline gap-2 text-base font-medium border-b border-zinc-900 dark:border-zinc-100 pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add item'}
              {!showAddForm && <span aria-hidden>→</span>}
            </button>
          </div>
        </section>

        {showSummary && (
          <section className="max-w-3xl mx-auto py-10 border-t border-zinc-200 dark:border-zinc-900">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8">
              <SummaryStat label="Assets" amount={formatAmount(totalAssets)} tone="positive" />
              <SummaryStat label="Debts" amount={formatAmount(totalDebts)} tone="negative" />
              <SummaryStat
                label="Net worth"
                amount={formatAmount(netWorth)}
                tone={netWorth >= 0 ? 'positive' : 'negative'}
              />
              <SummaryStat
                label="Monthly net"
                amount={formatAmount(monthlyNet)}
                tone={monthlyNet >= 0 ? 'positive' : 'negative'}
              />
            </div>
          </section>
        )}

        {showAddForm && (
          <section className="max-w-3xl mx-auto pb-10 border-t border-zinc-200 dark:border-zinc-900 pt-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-3">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {FINANCIAL_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-[0.18em] transition-colors border ${
                        newType === t
                          ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Family home, Car loan, Salary"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  Amount ({currencyConfig.symbol})
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
              </div>

              {(newType === 'income' || newType === 'expense') && (
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-3">
                    Frequency
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FREQUENCY_OPTIONS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setNewFrequency(newFrequency === f ? '' : f)}
                        className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-[0.18em] transition-colors border ${
                          newFrequency === f
                            ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700'
                        }`}
                      >
                        {FREQUENCY_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Joint account, Estimated value"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save item'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="max-w-3xl mx-auto pb-8 border-t border-zinc-200 dark:border-zinc-900 pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FinancialType | '')}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            >
              <option value="">All types</option>
              {FINANCIAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}s
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="max-w-3xl mx-auto pb-24">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 border-t border-zinc-200 dark:border-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                {typeFilter || search ? 'No items match your search.' : 'No financial items yet.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-900 border-t border-zinc-200 dark:border-zinc-900">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  formatAmount={formatAmount}
                  currencySymbol={currencyConfig.symbol}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SummaryStat({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: string;
  tone: 'positive' | 'negative';
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
        {label}
      </p>
      <p
        className={`text-3xl sm:text-4xl font-semibold tracking-tight ${
          tone === 'positive'
            ? 'text-zinc-900 dark:text-zinc-100'
            : 'text-rose-700 dark:text-rose-400'
        }`}
      >
        {amount}
      </p>
    </div>
  );
}

function ItemRow({
  item,
  onDelete,
  onUpdate,
  formatAmount,
  currencySymbol,
}: {
  item: FinancialItem;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<Pick<FinancialItem, 'type' | 'name' | 'amount' | 'frequency' | 'notes'>>
  ) => void;
  formatAmount: (n: number) => string;
  currencySymbol: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [editType, setEditType] = useState<FinancialType>(item.type);
  const [editFrequency, setEditFrequency] = useState<Frequency | ''>(item.frequency || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');

  const isNegative = item.type === 'debt' || item.type === 'expense';

  const handleSaveEdit = () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) return;
    if (!editName.trim()) return;

    onUpdate(item.id, {
      type: editType,
      name: editName.trim(),
      amount,
      frequency:
        editType === 'income' || editType === 'expense' ? editFrequency || null : null,
      notes: editNotes.trim() || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="py-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-3">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {FINANCIAL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setEditType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-[0.18em] transition-colors border ${
                    editType === t
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Amount ({currencySymbol})
            </label>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              min="0"
              step="0.01"
              className={inputClass}
            />
          </div>
          {(editType === 'income' || editType === 'expense') && (
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-3">
                Frequency
              </label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setEditFrequency(editFrequency === f ? '' : f)}
                    className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-[0.18em] transition-colors border ${
                      editFrequency === f
                        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Notes
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add a note…"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 pt-1">
            <button
              onClick={handleSaveEdit}
              className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="py-5">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {TYPE_LABELS[item.type]}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {item.name}
          </h3>
          {item.notes && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.notes}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="text-right">
            <p
              className={`text-2xl font-semibold tracking-tight ${
                isNegative
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {formatAmount(Number(item.amount))}
            </p>
            {item.frequency && (
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mt-1">
                {FREQUENCY_SUFFIX[item.frequency]}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            <button
              onClick={() => setEditing(true)}
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Edit
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onDelete(item.id);
                    setConfirmDelete(false);
                  }}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
