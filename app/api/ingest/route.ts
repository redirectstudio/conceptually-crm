import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchTranscript } from "@/lib/transcript";
import { extractProfileFromTranscript } from "@/lib/claude";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { youtube_url, manual_transcript } = await req.json();

    if (!youtube_url) {
      return NextResponse.json({ error: "youtube_url is required" }, { status: 400 });
    }

    const db = getServiceClient();

    const { data: job, error: jobError } = await db
      .from("crm_jobs")
      .insert({ youtube_url, status: "processing" })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json({ error: "Failed to create processing job" }, { status: 500 });
    }

    // Step 1: Get transcript — manual paste takes priority, then auto-fetch
    let transcriptText: string;
    let transcriptTitle: string | undefined;

    if (manual_transcript?.trim()) {
      transcriptText = manual_transcript.trim();
    } else {
      try {
        const result = await fetchTranscript(youtube_url);
        transcriptText = result.text;
        transcriptTitle = result.title;
      } catch (err) {
        await db
          .from("crm_jobs")
          .update({ status: "failed", error_message: String(err) })
          .eq("id", job.id);
        return NextResponse.json(
          { error: `Transcript fetch failed: ${err}` },
          { status: 422 }
        );
      }
    }

    // Step 2: Claude extraction
    let extraction;
    try {
      extraction = await extractProfileFromTranscript(transcriptText, transcriptTitle);
    } catch (err) {
      await db
        .from("crm_jobs")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", job.id);
      return NextResponse.json(
        { error: `AI extraction failed: ${err}` },
        { status: 500 }
      );
    }

    // Step 3: Save contact
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
      await db
        .from("crm_jobs")
        .update({ status: "failed", error_message: contactError.message })
        .eq("id", job.id);
      return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
    }

    // Mark job complete
    await db
      .from("crm_jobs")
      .update({ status: "complete", contact_id: contact.id })
      .eq("id", job.id);

    return NextResponse.json({ contact }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
