'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile, RelationshipType, Stage, Priority } from '@/types';
import {
  COUNTRY_OPTIONS,
  RELATIONSHIP_TYPE_OPTIONS,
  STAGE_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/onboarding-config';

import Header from '@/components/dashboard/Header';
import Footer from '@/components/dashboard/Footer';

const inputClass =
  'w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType | ''>('');
  const [stage, setStage] = useState<Stage | ''>('');
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [childrenCount, setChildrenCount] = useState<number | null>(null);
  const [childrenAges, setChildrenAges] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        const p = profile as Profile;
        setDisplayName(p.display_name || '');
        setCountry(p.country || '');
        setRelationshipType((p.relationship_type as RelationshipType) || '');
        setStage((p.stage as Stage) || '');
        setPriorities((p.priorities as Priority[]) || []);
        setHasChildren(p.has_children);
        setChildrenCount(p.children_count);
        setChildrenAges(p.children_ages || '');
      }

      setIsLoading(false);
    };

    loadProfile();
  }, [router]);

  const togglePriority = (priority: Priority) => {
    if (priorities.includes(priority)) {
      setPriorities(priorities.filter((p) => p !== priority));
    } else {
      setPriorities([...priorities, priority]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          country,
          relationship_type: relationshipType,
          stage,
          priorities,
          has_children: hasChildren,
          children_count: hasChildren ? childrenCount : null,
          children_ages: hasChildren ? childrenAges : null,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError('Failed to save. Please try again.');
        return;
      }

      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setPasswordMessage('Please fill in both fields');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('Passwords do not match');
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Password update error:', error);
        setPasswordMessage('Failed to update password. Please try again.');
      } else {
        setPasswordMessage('Password updated successfully');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setPasswordMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Header />
        <div className="px-6">
          <div className="max-w-3xl mx-auto py-24">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="px-6">
        <section className="max-w-3xl mx-auto pt-16 sm:pt-20 pb-12">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Profile
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Keep this up to date and the brief reads better.
          </p>
        </section>

        <FieldSection label="Your name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should we call you?"
            className={inputClass}
          />
        </FieldSection>

        <FieldSection label="Location">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
          >
            <option value="">Select your country</option>
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldSection>

        <FieldSection label="Relationship status">
          <OptionList
            options={RELATIONSHIP_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              description: o.description,
            }))}
            selected={relationshipType}
            onSelect={(v) => setRelationshipType(v as RelationshipType)}
          />
        </FieldSection>

        <FieldSection label="Where you are in the process">
          <OptionList
            options={STAGE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              description: o.description,
            }))}
            selected={stage}
            onSelect={(v) => setStage(v as Stage)}
          />
        </FieldSection>

        <FieldSection label="Your priorities" description="Pick as many as apply.">
          <OptionList
            options={PRIORITY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              description: o.description,
            }))}
            selected={priorities}
            onSelect={(v) => togglePriority(v as Priority)}
            multi
          />
        </FieldSection>

        <FieldSection label="Children">
          <OptionList
            options={[
              { value: 'yes', label: 'Yes, I have children' },
              { value: 'no', label: 'No children' },
            ]}
            selected={hasChildren === true ? 'yes' : hasChildren === false ? 'no' : ''}
            onSelect={(v) => setHasChildren(v === 'yes')}
          />
          {hasChildren && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  How many
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={childrenCount ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChildrenCount(val ? parseInt(val, 10) : null);
                  }}
                  placeholder="Enter number"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  Ages (optional)
                </label>
                <input
                  type="text"
                  value={childrenAges}
                  onChange={(e) => setChildrenAges(e.target.value)}
                  placeholder="e.g. 5, 8, 12"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </FieldSection>

        {(error || success) && (
          <section className="max-w-3xl mx-auto pt-6">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
            )}
          </section>
        )}

        <section className="max-w-3xl mx-auto py-10 border-t border-zinc-200 dark:border-zinc-900">
          <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              href="/dashboard"
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto pt-16 pb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
        </section>

        <FieldSection label="Change password">
          <div className="space-y-5">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (at least 8 characters)"
              className={inputClass}
            />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              className={inputClass}
            />
          </div>
          {passwordMessage && (
            <p
              className={`mt-4 text-sm ${
                passwordMessage.includes('successfully')
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {passwordMessage}
            </p>
          )}
          <div className="mt-6 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            <button
              onClick={handleChangePassword}
              disabled={passwordSaving}
              className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5 disabled:opacity-50"
            >
              {passwordSaving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </FieldSection>

        <section className="max-w-3xl mx-auto py-10 border-t border-zinc-200 dark:border-zinc-900 pb-24">
          <p className="text-xs uppercase tracking-[0.18em] text-red-600 dark:text-red-400 mb-3">
            Danger zone
          </p>
          <h3 className="text-xl font-semibold tracking-tight">Delete account</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
            This signs you out. To permanently delete your data, contact support.
          </p>
          <div className="mt-5 text-xs uppercase tracking-[0.18em]">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-5">
                <button
                  onClick={handleDeleteAccount}
                  className="text-red-600 dark:text-red-400 border-b border-red-600 dark:border-red-400 pb-0.5 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                >
                  Yes, sign me out
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors border-b border-red-600 dark:border-red-400 pb-0.5"
              >
                Delete account
              </button>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FieldSection({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-3xl mx-auto py-10 border-t border-zinc-200 dark:border-zinc-900">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
        {label}
      </p>
      {description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{description}</p>
      )}
      <div className={description ? '' : 'mt-5'}>{children}</div>
    </section>
  );
}

type Option = { value: string; label: string; description?: string };

function OptionList({
  options,
  selected,
  onSelect,
  multi,
}: {
  options: Option[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multi?: boolean;
}) {
  const isSelected = (value: string) =>
    Array.isArray(selected) ? selected.includes(value) : selected === value;

  return (
    <ul className="border-t border-zinc-200 dark:border-zinc-900">
      {options.map((o) => (
        <li key={o.value} className="border-b border-zinc-200 dark:border-zinc-900">
          <button
            type="button"
            onClick={() => onSelect(o.value)}
            className="w-full text-left flex items-start gap-4 py-4 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 -mx-4 px-4 transition-colors"
          >
            <span
              className={`mt-1.5 w-3 h-3 rounded-full border transition-colors shrink-0 ${
                isSelected(o.value)
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-zinc-900 dark:text-zinc-100">
                {o.label}
              </span>
              {o.description && (
                <span className="block text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {o.description}
                </span>
              )}
            </span>
            {multi && isSelected(o.value) && (
              <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 shrink-0 mt-1">
                Selected
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
