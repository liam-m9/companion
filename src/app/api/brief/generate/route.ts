import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Simple in-memory rate limit — resets on deploy, which is fine for MVP
const briefRateLimit = new Map<string, number[]>();

export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: max 3 briefs per 24h per user
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const timestamps = (briefRateLimit.get(user.id) || []).filter(t => now - t < dayMs);
  if (timestamps.length >= 3) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }
  timestamps.push(now);
  briefRateLimit.set(user.id, timestamps);

  try {
    // Fetch all user data in parallel
    const [journalRes, documentsRes, financesRes, timelineRes, profileRes] = await Promise.all([
      supabase
        .from('journal_entries')
        .select('title, content, mood, category, incident_date, ai_summary, created_at')
        .order('incident_date', { ascending: false })
        .limit(30),
      supabase
        .from('documents')
        .select('file_name, category, notes, uploaded_at')
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('financial_items')
        .select('type, name, amount, frequency, notes'),
      supabase
        .from('timeline_events')
        .select('title, description, event_date, category')
        .order('event_date', { ascending: false }),
      supabase
        .from('profiles')
        .select('country, relationship_type, stage, has_children, children_count, children_ages')
        .eq('id', user.id)
        .single(),
    ]);

    const journal = journalRes.data || [];
    const documents = documentsRes.data || [];
    const finances = financesRes.data || [];
    const timeline = timelineRes.data || [];
    const profile = profileRes.data;

    // Build financial summary
    const assets = finances.filter(f => f.type === 'asset');
    const debts = finances.filter(f => f.type === 'debt');
    const income = finances.filter(f => f.type === 'income');
    const expenses = finances.filter(f => f.type === 'expense');

    const totalAssets = assets.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalDebts = debts.reduce((sum, i) => sum + Number(i.amount), 0);
    const monthlyIncome = income.reduce((sum, i) => {
      const amt = Number(i.amount);
      if (i.frequency === 'annually') return sum + amt / 12;
      return sum + amt;
    }, 0);
    const monthlyExpenses = expenses.reduce((sum, i) => {
      const amt = Number(i.amount);
      if (i.frequency === 'annually') return sum + amt / 12;
      return sum + amt;
    }, 0);

    // Build the prompt sections
    const sections: string[] = [];

    // Profile context
    if (profile) {
      const profileLines = [];
      if (profile.country) profileLines.push(`Country: ${profile.country}`);
      if (profile.relationship_type) profileLines.push(`Relationship type: ${profile.relationship_type.replace('_', ' ')}`);
      if (profile.stage) profileLines.push(`Current stage: ${profile.stage.replace('_', ' ')}`);
      if (profile.has_children) {
        profileLines.push(`Children: ${profile.children_count || 'yes'}${profile.children_ages ? ` (ages: ${profile.children_ages})` : ''}`);
      }
      if (profileLines.length > 0) {
        sections.push(`CLIENT PROFILE:\n${profileLines.join('\n')}`);
      }
    }

    // Journal entries
    if (journal.length > 0) {
      const journalText = journal.map((e, i) => {
        const lines = [`Entry ${i + 1} — ${e.incident_date || 'No date'}${e.category ? ` [${e.category}]` : ''}${e.mood ? ` (mood: ${e.mood})` : ''}`];
        if (e.title) lines.push(`Title: ${e.title}`);
        // Use AI summary if available, otherwise truncate content
        if (e.ai_summary) {
          lines.push(`Summary: ${e.ai_summary}`);
        } else {
          lines.push(`Content: ${e.content.substring(0, 500)}${e.content.length > 500 ? '...' : ''}`);
        }
        return lines.join('\n');
      }).join('\n\n');
      sections.push(`JOURNAL ENTRIES (${journal.length} total, most recent first):\n${journalText}`);
    }

    // Timeline
    if (timeline.length > 0) {
      const timelineText = timeline.map(e => {
        let line = `- ${e.event_date}: ${e.title}`;
        if (e.category) line += ` [${e.category}]`;
        if (e.description) line += ` — ${e.description}`;
        return line;
      }).join('\n');
      sections.push(`KEY EVENTS TIMELINE (${timeline.length} events):\n${timelineText}`);
    }

    // Financial summary
    if (finances.length > 0) {
      const finLines = [];
      if (assets.length > 0) {
        finLines.push(`Assets (${assets.length}): Total $${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        assets.forEach(a => finLines.push(`  - ${a.name}: $${Number(a.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}${a.notes ? ` (${a.notes})` : ''}`));
      }
      if (debts.length > 0) {
        finLines.push(`Debts (${debts.length}): Total $${totalDebts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        debts.forEach(d => finLines.push(`  - ${d.name}: $${Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}${d.notes ? ` (${d.notes})` : ''}`));
      }
      finLines.push(`Net Worth: $${(totalAssets - totalDebts).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      if (income.length > 0) {
        finLines.push(`Monthly Income: $${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        income.forEach(i => finLines.push(`  - ${i.name}: $${Number(i.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}${i.frequency ? ` (${i.frequency})` : ''}`));
      }
      if (expenses.length > 0) {
        finLines.push(`Monthly Expenses: $${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        expenses.forEach(e => finLines.push(`  - ${e.name}: $${Number(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}${e.frequency ? ` (${e.frequency})` : ''}`));
      }
      sections.push(`FINANCIAL OVERVIEW:\n${finLines.join('\n')}`);
    }

    // Documents list
    if (documents.length > 0) {
      const docText = documents.map(d => {
        let line = `- ${d.file_name}`;
        if (d.category) line += ` [${d.category}]`;
        if (d.notes) line += ` — ${d.notes}`;
        return line;
      }).join('\n');
      sections.push(`DOCUMENTS ON FILE (${documents.length}):\n${docText}`);
    }

    // Check if there's any data at all
    if (journal.length === 0 && timeline.length === 0 && finances.length === 0 && documents.length === 0) {
      return NextResponse.json({ error: 'No data to generate brief from. Add some journal entries, timeline events, or financial items first.' }, { status: 400 });
    }

    const userContent = sections.join('\n\n---\n\n');

    const chatCompletion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 3000,
      messages: [
        {
          role: 'system',
          content: `You are a professional divorce case briefing assistant. You generate comprehensive situation briefs for legal professionals (lawyers, mediators) and therapists.

Given the client's complete case data below, generate a professional 1-2 page situation brief with these sections:

CLIENT OVERVIEW
Brief description of the client's situation, relationship type, stage, children if applicable. 2-3 sentences.

SITUATION SUMMARY
A clear, chronological narrative of the case based on journal entries and timeline events. Focus on key facts, incidents, and patterns. 3-5 paragraphs.

KEY INCIDENTS
Bulleted list of the most significant events, with dates. Focus on legally relevant incidents — threats, custody issues, financial disputes, safety concerns.

FINANCIAL POSITION
Summary of assets, debts, income, expenses, and net position. Highlight any financial concerns or disputes.

DOCUMENTS AVAILABLE
List of documents the client has collected and their relevance.

AREAS OF CONCERN
Bulleted list of issues that need professional attention — safety, custody, financial, legal deadlines, emotional wellbeing.

RECOMMENDED NEXT STEPS
Actionable recommendations based on the data.

Rules:
- Professional, third-person tone throughout
- Factual and objective — no emotional language
- If information is missing or unclear, note it rather than guessing
- Flag urgent safety or legal concerns prominently
- Include specific dates where available
- Keep it concise but comprehensive — a lawyer should be able to understand the full picture from this brief alone
- Do NOT include any preamble or closing remarks — just the structured brief`,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const brief = chatCompletion.choices[0]?.message?.content ?? '';

    return NextResponse.json({
      brief,
      stats: {
        journalCount: journal.length,
        documentCount: documents.length,
        financialCount: finances.length,
        timelineCount: timeline.length,
      },
    });
  } catch (err) {
    console.error('Brief generation error:', err);
    return NextResponse.json({ error: 'Failed to generate brief. Please try again.' }, { status: 500 });
  }
}
