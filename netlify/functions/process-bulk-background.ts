import { createClient } from "@supabase/supabase-js";
import { fetchTranscript } from "../../lib/transcript";
import { extractProfileFromTranscript } from "../../lib/claude";

interface BulkJob {
  jobId: string;
  url: string;
}

export default async (req: Request): Promise<void> => {
  const { jobs }: { jobs: BulkJob[] } = await req.json();

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Process sequentially — one at a time, no concurrent API calls
  for (const { jobId, url } of jobs) {
    try {
      await db.from("crm_jobs").update({ status: "processing" }).eq("id", jobId);

      // Step 1: Transcript (youtube-transcript → Supadata fallback)
      let transcriptText: string;
      let transcriptTitle: string | undefined;

      try {
        const result = await fetchTranscript(url);
        transcriptText = result.text;
        transcriptTitle = result.title;
      } catch (err) {
        await db
          .from("crm_jobs")
          .update({ status: "failed", error_message: `Transcript fetch failed: ${err}` })
          .eq("id", jobId);
        continue; // Move on to the next URL
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
        continue;
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
          episode_url: url,
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
        continue;
      }

      await db
        .from("crm_jobs")
        .update({ status: "complete", contact_id: contact.id })
        .eq("id", jobId);
    } catch (err) {
      // Crash guard — job never gets stuck at "processing"
      await db
        .from("crm_jobs")
        .update({ status: "failed", error_message: `Unexpected error: ${err}` })
        .eq("id", jobId);
    }

    // Brief pause between jobs — courteous to downstream APIs
    await new Promise((r) => setTimeout(r, 1500));
  }
};
