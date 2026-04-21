'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Card className="w-full max-w-md p-8">
        {sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Check your email
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              We sent a password reset link to <strong>{email}</strong>. It may take a minute to arrive.
            </p>
            <Link
              href="/login"
              className="text-zinc-900 dark:text-white font-medium hover:underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Reset your password
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>

            <p className="text-center mt-6 text-zinc-600 dark:text-zinc-400">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-zinc-900 dark:text-white font-medium hover:underline"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
