import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchTranscript } from "@/lib/transcript";
import { extractProfileFromTranscript } from "@/lib/claude";

const MAX_TRANSCRIPT_CHARS = 25000;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { youtube_url, manual_transcript } = await req.json();

  if (!youtube_url) {
    return NextResponse.json({ error: "youtube_url is required" }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: existing } = await db
    .from("crm_contacts")
    .select("id, name")
    .eq("episode_url", youtube_url)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Already processed — "${existing.name}" already exists for this URL` },
      { status: 409 }
    );
  }

  let transcriptText: string;
  let transcriptTitle: string | undefined;

  if (manual_transcript?.trim()) {
    transcriptText = manual_transcript.trim();
  } else {
    try {
      const result = await fetchTranscript(youtube_url);
      transcriptText = result.text;
      transcriptTitle = result.title;
    } catch (err: unknown) {
      const msg = String(err);
      const noCaption =
        msg.toLowerCase().includes("transcript") ||
        msg.toLowerCase().includes("caption") ||
        msg.toLowerCase().includes("disabled") ||
        msg.toLowerCase().includes("unavailable");
      return NextResponse.json({ error: msg, no_captions: noCaption }, { status: 422 });
    }
  }

  // Truncate long transcripts so Claude finishes well within Netlify's 26s limit
  if (transcriptText.length > MAX_TRANSCRIPT_CHARS) {
    transcriptText = transcriptText.slice(0, MAX_TRANSCRIPT_CHARS);
  }

  let extraction;
  try {
    extraction = await extractProfileFromTranscript(transcriptText, transcriptTitle);
  } catch (err) {
    return NextResponse.json({ error: `AI extraction failed: ${err}` }, { status: 500 });
  }

  const { data: contact, error: contactError } = await db
    .from("crm_contacts")
    .insert({
      name: extraction.name,
      title: extraction.title,
      location: extraction.location,
      personal_bio: extraction.personal_bio,
      childhood_notes: extraction.childhood_notes,
      business_name: extraction.business_name,
      industry: extraction.industry,
      business_stage: extraction.business_stage,
      has_audience: extraction.has_audience,
      audience_size: extraction.audience_size,
      business_summary: extraction.business_summary,
      where_we_can_help: extraction.where_we_can_help,
      key_quotes: extraction.key_quotes,
      readiness_score: extraction.readiness_score,
      readiness_reasoning: extraction.readiness_reasoning,
      episode_url: youtube_url,
      episode_title: transcriptTitle || null,
      transcript_raw: transcriptText,
      outreach_status: "not_contacted",
      meeting_booked: false,
      converted: false,
    })
    .select()
    .single();

  if (contactError) {
    return NextResponse.json({ error: contactError.message }, { status: 500 });
  }

  return NextResponse.json({ contact_id: contact.id, name: contact.name });
}
