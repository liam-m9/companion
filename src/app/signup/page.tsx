'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.refresh();
      router.push('/onboarding');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="px-6 pt-8 sm:pt-12">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          <Link
            href="/"
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            ← Companion
          </Link>
          <Link
            href="/login"
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="px-6">
        <section className="max-w-sm mx-auto pt-20 sm:pt-28 pb-24">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-6">
            Sign up
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-[1.1]">
            Create an account.
          </h1>

          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <Field
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              required
            />
            <Field
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
            Your data is private. Only you can see it.
          </p>

          <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="border-b border-zinc-900 dark:border-zinc-100 pb-0.5 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>

      <footer className="px-6 pb-12">
        <div className="max-w-2xl mx-auto pt-8 border-t border-zinc-200 dark:border-zinc-900 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          <span>© 2026 Companion</span>
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-3 text-base placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
      />
    </label>
  );
}
