# Companion

Web app that helps people going through divorce stay organised. Private journal with AI summaries, document vault, financial tracker, timeline of events, and a brief generator that pulls everything together into something you can hand to a solicitor. Built with Next.js, Supabase, and Tailwind.

## Running locally

```bash
npm install
```

Add a `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

```bash
npm run dev
```

You'll need a Supabase project with the tables set up (profiles, journal entries, documents, financial items, timeline events, checklist progress). Everything is behind RLS.

## AI

Uses Groq with Llama 3.3 70B for two things:

- **Journal summaries** — turns a journal entry into a structured report with dates, who was involved, what happened. Makes it easier to hand off to a solicitor instead of them reading raw entries.

- **Brief generator** — pulls together journal entries, finances, timeline, and documents into one professional summary of the whole situation. Copy it or print to PDF.
