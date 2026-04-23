import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  // Deduplication: skip if this URL was already processed
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

  // Create job record
  const { data: job, error: jobError } = await db
    .from("crm_jobs")
    .insert({ youtube_url, status: "pending" })
    .select()
    .single();

  if (jobError) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Trigger background function — must await so the request isn't killed when this function exits
  const siteUrl = process.env.URL ?? "http://localhost:8888";
  await fetch(`${siteUrl}/.netlify/functions/process-episode-background`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: job.id, youtube_url, manual_transcript }),
  }).catch(() => {});

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
