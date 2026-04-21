'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        router.refresh();
        if (profile?.onboarding_completed) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
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
            href="/signup"
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="px-6">
        <section className="max-w-sm mx-auto pt-20 sm:pt-28 pb-24">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-6">
            Log in
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-[1.1]">
            Welcome back.
          </h1>

          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <Field
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(v) => setEmail(v)}
              required
            />
            <Field
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(v) => setPassword(v)}
              required
            />

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Logging in…' : 'Log in →'}
            </button>
          </form>

          <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="border-b border-zinc-900 dark:border-zinc-100 pb-0.5 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              Sign up
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
