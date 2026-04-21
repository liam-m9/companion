import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: max 5 summaries per hour per user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('ai_summary_generated_at', oneHourAgo);

  if (count !== null && count >= 5) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.entryId || typeof body.entryId !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { entryId } = body;

  // Fetch entry and verify ownership via RLS
  const { data: entry, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single();

  if (error || !entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  try {
    const chatCompletion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `You are a professional case summariser for divorce and family law matters. You convert raw, emotional journal entries into structured incident reports suitable for lawyers and therapists.

Output format — use these exact headings with no quotes around them:

Incident Date
Use the date provided in the metadata. Do NOT try to extract a date from the entry text.

People Involved
List each person and their relationship (e.g. "Spouse", "Child (age 8)").

Key Events
Numbered list of what happened, in chronological order. One sentence each. Factual only.

Statements Made
Direct or paraphrased statements, especially anything threatening, financial, or legally relevant. If none, write "None recorded".

Children's Involvement
How children were affected or present. If not mentioned, write "No children mentioned".

Legally Significant Points
Flag anything a lawyer should pay attention to — threats, financial disclosure, custody issues, property disputes.

Current Status
How things stand now based on the entry.

Rules:
- No emotional language — strip it all out
- Third person, professional tone throughout
- Be concise — one sentence per bullet point where possible
- If something is unclear, write "Unclear from entry" rather than guessing
- Do NOT add section numbers or quotes around headings
- Do NOT include any preamble or closing remarks — just the structured report`,
        },
        {
          role: 'user',
          content: `Entry title: ${entry.title || 'Untitled'}\nIncident date: ${entry.incident_date}\nCategory: ${entry.category || 'Not specified'}\nMood: ${entry.mood || 'Not specified'}\n\nJournal entry:\n${entry.content}`,
        },
      ],
    });

    const summary = chatCompletion.choices[0]?.message?.content ?? '';

    // Save summary to DB
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save summary' }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('Groq API error:', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
