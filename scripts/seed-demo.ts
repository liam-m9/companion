import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}
if (!EMAIL || !PASSWORD) {
  console.error("Missing TEST_EMAIL or TEST_PASSWORD");
  process.exit(1);
}

// A minimal valid one-page blank PDF. Good enough to pass mime sniffing and upload.
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000054 00000 n \n0000000101 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n147\n%%EOF\n",
  "utf-8"
);

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

  console.log(`Signing in as ${EMAIL}...`);
  const { data: auth, error: signInError } = await supabase.auth.signInWithPassword({
    email: EMAIL!,
    password: PASSWORD!,
  });
  if (signInError || !auth.user) {
    console.error("Sign-in failed:", signInError?.message);
    process.exit(1);
  }
  const userId = auth.user.id;
  console.log(`Logged in. user_id=${userId}`);

  // Wipe existing demo rows so running this twice is safe
  console.log("Clearing previous demo rows...");
  await supabase.from("journal_entries").delete().eq("user_id", userId);
  await supabase.from("financial_items").delete().eq("user_id", userId);
  await supabase.from("timeline_events").delete().eq("user_id", userId);
  const { data: oldDocs } = await supabase.from("documents").select("file_path").eq("user_id", userId);
  if (oldDocs && oldDocs.length > 0) {
    await supabase.storage.from("documents").remove(oldDocs.map((d) => d.file_path));
  }
  await supabase.from("documents").delete().eq("user_id", userId);

  // Journal entries
  console.log("Inserting journal entries...");
  const journalEntries = [
    {
      user_id: userId,
      title: "Discussion about childcare handover times",
      mood: "calm",
      category: "children",
      incident_date: "2026-04-05",
      content:
        "Met at the coffee shop near the school to talk through adjusting Thursday pickup from 5pm to 5:30pm so it fits my new work schedule. Agreed to trial it for a month and review. Kids mentioned wanting handovers to happen at the house rather than the school car park — will raise this next time.",
    },
    {
      user_id: userId,
      title: "Initial consultation with solicitor",
      mood: "hopeful",
      category: "legal",
      incident_date: "2026-04-14",
      content:
        "First meeting with Harris & Co in Holborn. Went through the separation timeline, finances overview, and current living arrangements. She explained the difference between mediation and going straight to court. She needs: 12 months of bank statements, mortgage docs, pension statements, and recent payslips. Follow-up booked for next Friday.",
      ai_summary:
        "INCIDENT REPORT\n\nDate: 14 April 2026\nCategory: Legal consultation\n\nSummary:\nAttended first consultation with solicitor at Harris & Co (Holborn). Covered separation timeline, current finances, and living arrangements.\n\nKey points discussed:\n- Distinction between mediation and court proceedings explained\n- Mediation recommended as initial route\n- Document requirements outlined by solicitor\n\nDocuments requested:\n- 12 months of bank statements (personal and joint)\n- Mortgage documentation\n- Pension statements\n- Recent payslips (3 months)\n\nNext steps:\n- Gather requested documents\n- Follow-up meeting scheduled for following Friday\n\nEmotional state: Hopeful. First concrete step taken toward resolution.",
      ai_summary_generated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      title: "Mortgage statement review",
      mood: "anxious",
      category: "financial",
      incident_date: "2026-04-20",
      content:
        "Pulled the last three mortgage statements from the joint account. Outstanding balance is £218,400, monthly payment £1,247. Need to work out if buying out is realistic or whether selling is the only option. Asked Barclays for an affordability check on my own salary — waiting to hear back.",
    },
  ];
  const { error: jErr } = await supabase.from("journal_entries").insert(journalEntries);
  if (jErr) throw jErr;
  console.log(`  ${journalEntries.length} journal entries inserted.`);

  // Financial items
  console.log("Inserting financial items...");
  const financialItems = [
    { user_id: userId, type: "asset", name: "Primary residence (joint)", amount: 485000, frequency: "one_time", notes: "Mortgaged property, jointly owned." },
    { user_id: userId, type: "asset", name: "Joint savings (Barclays)", amount: 12400, frequency: "one_time", notes: null },
    { user_id: userId, type: "asset", name: "Pension (current employer)", amount: 48200, frequency: "one_time", notes: null },
    { user_id: userId, type: "debt", name: "Mortgage outstanding", amount: 218400, frequency: "one_time", notes: "Barclays, 18 years remaining." },
    { user_id: userId, type: "debt", name: "Credit card balance", amount: 2100, frequency: "one_time", notes: null },
    { user_id: userId, type: "income", name: "Salary", amount: 4200, frequency: "monthly", notes: "Net of tax." },
    { user_id: userId, type: "expense", name: "Mortgage payment", amount: 1247, frequency: "monthly", notes: null },
    { user_id: userId, type: "expense", name: "Childcare", amount: 640, frequency: "monthly", notes: null },
    { user_id: userId, type: "expense", name: "Utilities", amount: 245, frequency: "monthly", notes: null },
  ];
  const { error: fErr } = await supabase.from("financial_items").insert(financialItems);
  if (fErr) throw fErr;
  console.log(`  ${financialItems.length} financial items inserted.`);

  // Timeline events
  console.log("Inserting timeline events...");
  const timelineEvents = [
    { user_id: userId, title: "Separation date", category: "personal", event_date: "2025-09-15", description: "Moved into rental flat in Highgate." },
    { user_id: userId, title: "First solicitor consultation", category: "legal", event_date: "2026-04-14", description: "Met with Harris & Co in Holborn." },
    { user_id: userId, title: "School parents evening", category: "children", event_date: "2026-04-20", description: "Attended jointly. Both kids doing well academically." },
    { user_id: userId, title: "Mediation session booked", category: "legal", event_date: "2026-05-10", description: "First session with accredited mediator. Confirmation letter received." },
  ];
  const { error: tErr } = await supabase.from("timeline_events").insert(timelineEvents);
  if (tErr) throw tErr;
  console.log(`  ${timelineEvents.length} timeline events inserted.`);

  // Documents: upload a dummy PDF per document then insert metadata
  console.log("Uploading dummy PDFs and inserting document metadata...");
  const documents = [
    { file_name: "separation-agreement-draft.pdf", category: "legal", notes: "Draft from solicitor, first review pending." },
    { file_name: "mortgage-statement-apr-2026.pdf", category: "financial", notes: "Monthly statement from Barclays." },
    { file_name: "letter-from-solicitor.pdf", category: "correspondence", notes: "Initial engagement letter." },
  ];
  for (const doc of documents) {
    const safeName = doc.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${userId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(filePath, MINIMAL_PDF, {
      contentType: "application/pdf",
    });
    if (upErr) throw upErr;
    const { error: dErr } = await supabase.from("documents").insert({
      user_id: userId,
      file_name: doc.file_name,
      file_path: filePath,
      file_size: MINIMAL_PDF.byteLength,
      mime_type: "application/pdf",
      category: doc.category,
      notes: doc.notes,
    });
    if (dErr) throw dErr;
    console.log(`  ${doc.file_name}`);
    // Ensure unique timestamps if the loop runs faster than 1ms
    await new Promise((r) => setTimeout(r, 2));
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
