export type BusinessStage = "idea" | "pre_revenue" | "early_revenue" | "growing" | "scaling";

export type OutreachStatus =
  | "not_contacted"
  | "reached_out"
  | "responded"
  | "meeting_booked"
  | "converted"
  | "not_a_fit";

export interface KeyQuote {
  quote: string;
  context: string;
}

export interface Contact {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  title: string | null;
  location: string | null;
  headshot_url: string | null;
  episode_url: string | null;
  episode_title: string | null;
  podcast_date: string | null;
  transcript_raw: string | null;
  personal_bio: string | null;
  childhood_notes: string | null;
  key_quotes: KeyQuote[] | null;
  business_name: string | null;
  industry: string | null;
  business_stage: BusinessStage | null;
  has_audience: boolean | null;
  audience_size: string | null;
  business_summary: string | null;
  where_we_can_help: string | null;
  readiness_score: number | null;
  readiness_reasoning: string | null;
  outreach_status: OutreachStatus;
  outreach_notes: string | null;
  last_contacted: string | null;
  meeting_booked: boolean;
  converted: boolean;
}

export interface ProcessingJob {
  id: string;
  created_at: string;
  youtube_url: string;
  status: "pending" | "processing" | "complete" | "failed";
  error_message: string | null;
  contact_id: string | null;
}

export interface ClaudeExtraction {
  name: string;
  title: string | null;
  location: string | null;
  personal_bio: string;
  childhood_notes: string | null;
  business_name: string | null;
  industry: string | null;
  business_stage: BusinessStage;
  has_audience: boolean;
  audience_size: string | null;
  business_summary: string;
  where_we_can_help: string;
  key_quotes: KeyQuote[];
  readiness_score: number;
  readiness_reasoning: string;
}
