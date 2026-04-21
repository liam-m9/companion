import { createBrowserClient } from '@supabase/ssr';

// No-op stub for static prerender — any property access or method call
// returns another stub, so chained calls like supabase.from(...).select(...)
// don't throw. Real supabase calls only fire client-side in useEffect/handlers.
const prerenderStub: any = new Proxy(() => prerenderStub, {
  get: () => prerenderStub,
  apply: () => prerenderStub,
});

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window === 'undefined') return prerenderStub;
    throw new Error('Supabase env vars missing');
  }

  return createBrowserClient(url, key);
}
