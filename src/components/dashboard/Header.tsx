'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/journal', label: 'Journal' },
  { href: '/vault', label: 'Vault' },
  { href: '/finances', label: 'Finances' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/brief', label: 'Brief' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <header
      ref={menuRef}
      className="px-6 pt-8 sm:pt-12 pb-6 border-b border-zinc-200 dark:border-zinc-900 relative"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          Companion
        </Link>

        <nav className="hidden md:flex items-center gap-x-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? 'text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="md:hidden text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <div className="md:hidden absolute left-0 right-0 top-full mt-px bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 z-20">
          <nav className="max-w-3xl mx-auto px-6 py-4 flex flex-col gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={
                  isActive(link.href)
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors'
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
