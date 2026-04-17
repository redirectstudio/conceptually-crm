import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeExtraction } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are analyzing a podcast interview transcript to build a CRM profile for the guest.

The podcast is "Extraordinary Stories" hosted by Forbes Shannon — a nomination-only collaborative for leaders. Your job is to extract structured information about the guest that will help identify whether they're a strong candidate for Conceptually, an AI business accelerator that invests $250K in services into the best ventures (founders pay $10K to fast-track or apply for a scholarship, giving 5% equity in return).

Extract everything you can find in the transcript. If information is not mentioned, return null for that field. Do not hallucinate or infer things not supported by the transcript.

Return a valid JSON object and nothing else — no markdown, no explanation, just the JSON.

Readiness Score Rubric (1–5):
1: Pre-idea or very early stage. Mostly personal journey. No business or product. No audience. No clear monetization path.
2: Has an idea or concept. May have started something small. Pre-revenue. No clear audience yet.
3: Active builder. Has a real product or service. Early revenue or growing audience. Wants to scale or automate.
4: Established business with real revenue or strong distribution (10K+ audience). Clear bottleneck. Can likely write $10K or qualify for scholarship.
5: Scaling business with proven model. Strong distribution AND monetization. Obvious AI/build gap. Expressed urgency. High probability of converting.

JSON schema to return:
{
  "name": "string",
  "title": "string or null",
  "location": "string or null",
  "personal_bio": "2-3 sentence paraphrased bio based on what they share",
  "childhood_notes": "string or null — where they grew up, schools, family background if mentioned",
  "business_name": "string or null",
  "industry": "string or null",
  "business_stage": "one of: idea | pre_revenue | early_revenue | growing | scaling",
  "has_audience": true or false,
  "audience_size": "string or null — describe size and platform if mentioned",
  "business_summary": "2-3 sentence summary of what they're building and where it's at",
  "where_we_can_help": "their biggest bottleneck or opportunity where Conceptually's AI + build services could help. Be specific. If unclear, say so.",
  "key_quotes": [{"quote": "exact quote from transcript", "context": "brief context"}],
  "readiness_score": integer 1-5,
  "readiness_reasoning": "1-2 sentences explaining why this score"
}`;

export async function extractProfileFromTranscript(
  transcript: string,
  episodeTitle?: string
): Promise<ClaudeExtraction> {
  const userContent = episodeTitle
    ? `Episode: "${episodeTitle}"\n\nTranscript:\n${transcript}`
    : `Transcript:\n${transcript}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown code blocks if Claude wrapped the JSON
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  const parsed = JSON.parse(cleaned) as ClaudeExtraction;
  return parsed;
}
