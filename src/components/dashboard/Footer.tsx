'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Footer() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <footer className="px-6 pb-12">
      <div className="max-w-3xl mx-auto pt-8 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
        <span>© 2026 Companion</span>
        <div className="flex items-center gap-5">
          <Link
            href="/profile"
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="uppercase tracking-[0.18em] hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </footer>
  );
}
