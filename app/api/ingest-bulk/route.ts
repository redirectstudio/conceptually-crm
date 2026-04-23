import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { urls } = await req.json();

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls array is required" }, { status: 400 });
  }

  const db = getServiceClient();

  // Create a job for each URL, skipping duplicates
  const jobs: { url: string; jobId: string | null; error?: string }[] = [];

  for (const url of urls) {
    const { data: existing } = await db
      .from("crm_contacts")
      .select("id, name")
      .eq("episode_url", url)
      .maybeSingle();

    if (existing) {
      jobs.push({ url, jobId: null, error: `Already exists: "${existing.name}"` });
      continue;
    }

    const { data: job, error: jobError } = await db
      .from("crm_jobs")
      .insert({ youtube_url: url, status: "pending" })
      .select()
      .single();

    if (jobError) {
      jobs.push({ url, jobId: null, error: "Failed to create job" });
      continue;
    }

    jobs.push({ url, jobId: job.id });
  }

  // Trigger the background function — must await so the request isn't killed when this function exits
  const pendingJobs = jobs.filter((j) => j.jobId !== null);
  if (pendingJobs.length > 0) {
    const siteUrl = process.env.URL ?? "http://localhost:8888";
    await fetch(`${siteUrl}/.netlify/functions/process-bulk-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs: pendingJobs }),
    }).catch(() => {});
  }

  return NextResponse.json({ jobs }, { status: 202 });
}
