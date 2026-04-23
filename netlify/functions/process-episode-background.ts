import { createClient } from "@supabase/supabase-js";
import { fetchTranscript } from "../../lib/transcript";
import { extractProfileFromTranscript } from "../../lib/claude";

export default async (req: Request): Promise<void> => {
  const { jobId, youtube_url, manual_transcript } = await req.json();

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    await db.from("crm_jobs").update({ status: "processing" }).eq("id", jobId);

    // Step 1: Transcript (youtube-transcript → Supadata fallback)
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
          .update({ status: "failed", error_message: `Transcript fetch failed: ${err}` })
          .eq("id", jobId);
        return;
      }
    }

    // Step 2: Claude extraction
    let extraction;
    try {
      extraction = await extractProfileFromTranscript(transcriptText, transcriptTitle);
    } catch (err) {
      await db
        .from("crm_jobs")
        .update({ status: "failed", error_message: `AI extraction failed: ${err}` })
        .eq("id", jobId);
      return;
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
        .eq("id", jobId);
      return;
    }

    await db
      .from("crm_jobs")
      .update({ status: "complete", contact_id: contact.id })
      .eq("id", jobId);
  } catch (err) {
    // Catch-all so the job never gets stuck at "processing"
    await db
      .from("crm_jobs")
      .update({ status: "failed", error_message: `Unexpected error: ${err}` })
      .eq("id", jobId);
  }
};
