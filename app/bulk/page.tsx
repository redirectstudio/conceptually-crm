"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase-browser";

type JobStatus = "pending" | "processing" | "done" | "error" | "needs_transcript";

interface Job {
  url: string;
  status: JobStatus;
  contactId?: string;
  contactName?: string;
  error?: string;
}

export default function BulkUpload() {
  const [raw, setRaw] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [startError, setStartError] = useState("");

  function parseUrls(): string[] {
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.includes("youtube.com") || l.includes("youtu.be"));
  }

  const validCount = parseUrls().length;
  const started = jobs.length > 0;
  const allDone = started && jobs.every((j) => j.status !== "pending" && j.status !== "processing");

  function updateJob(index: number, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j, i) => (i === index ? { ...j, ...patch } : j)));
  }

  async function checkIfCreated(url: string): Promise<{ id: string; name: string } | null> {
    try {
      const db = getBrowserClient();
      const { data } = await db
        .from("crm_contacts")
        .select("id, name")
        .eq("episode_url", url)
        .maybeSingle();
      return data as { id: string; name: string } | null;
    } catch {
      return null;
    }
  }

  async function start() {
    const urls = parseUrls();
    if (!urls.length || running) return;

    setRunning(true);
    setStartError("");

    const initial: Job[] = urls.map((url) => ({ url, status: "pending" }));
    setJobs(initial);

    for (let i = 0; i < urls.length; i++) {
      updateJob(i, { status: "processing" });

      try {
        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtube_url: urls[i] }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 409) {
          updateJob(i, { status: "error", error: data.error ?? "Already exists" });
          continue;
        }

        if (res.status === 422 && data.no_captions) {
          updateJob(i, { status: "needs_transcript", error: "No captions — add manually via single upload" });
          continue;
        }

        if (!res.ok) {
          // 504 means Netlify timed out, but the contact may have been saved anyway
          const created = await checkIfCreated(urls[i]);
          if (created) {
            updateJob(i, { status: "done", contactId: created.id, contactName: created.name });
          } else {
            updateJob(i, { status: "error", error: data.error ?? `Server error (${res.status})` });
          }
          continue;
        }

        updateJob(i, { status: "done", contactId: data.contact_id, contactName: data.name });
      } catch {
        // Network error — still check if it saved before failing
        const created = await checkIfCreated(urls[i]);
        if (created) {
          updateJob(i, { status: "done", contactId: created.id, contactName: created.name });
        } else {
          updateJob(i, { status: "error", error: "Network error — try again" });
        }
      }
    }

    setRunning(false);
  }

  function reset() {
    setJobs([]);
    setRaw("");
    setStartError("");
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bulk Upload</h1>
          <p className="text-sm text-gray-500 mt-2">
            Paste multiple YouTube URLs — one per line. We&apos;ll process them in order, one at a time.
          </p>
        </div>

        {!started && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">YouTube URLs</label>
              <textarea
                value={raw}
                onChange={(e) => { setRaw(e.target.value); setStartError(""); }}
                placeholder={"https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...\nhttps://youtu.be/..."}
                rows={10}
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 resize-none font-mono"
              />
              {validCount > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {validCount} valid URL{validCount !== 1 ? "s" : ""} detected
                </p>
              )}
            </div>

            {startError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{startError}</p>
              </div>
            )}

            <button
              onClick={start}
              disabled={validCount === 0 || running}
              className="w-full bg-black text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {running ? "Starting..." : `Process ${validCount > 0 ? `${validCount} Episode${validCount !== 1 ? "s" : ""}` : "Episodes"}`}
            </button>
          </div>
        )}

        {started && (
          <div className="space-y-3">
            {jobs.map((job, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                <StatusDot status={job.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate font-mono">{job.url}</p>
                  {job.status === "pending" && (
                    <p className="text-xs text-gray-400 mt-0.5">Waiting...</p>
                  )}
                  {job.status === "processing" && (
                    <p className="text-xs text-gray-500 mt-0.5">Transcribing and analyzing...</p>
                  )}
                  {job.status === "done" && job.contactName && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-medium text-gray-900">{job.contactName}</p>
                      {job.contactId && (
                        <Link
                          href={`/contacts/${job.contactId}`}
                          className="text-xs text-gray-400 hover:text-black underline underline-offset-2 transition-colors"
                        >
                          View profile ↗
                        </Link>
                      )}
                    </div>
                  )}
                  {job.status === "error" && (
                    <p className="text-xs text-red-500 mt-0.5">{job.error}</p>
                  )}
                  {job.status === "needs_transcript" && (
                    <p className="text-xs text-yellow-600 mt-0.5">{job.error}</p>
                  )}
                </div>
              </div>
            ))}

            {running && (
              <p className="text-xs text-gray-400 pt-1">
                Keep this tab open — processing one at a time. Each episode takes 15–25 seconds.
              </p>
            )}

            {allDone && (
              <div className="pt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {jobs.filter((j) => j.status === "done").length} of {jobs.length} profiles created
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={reset}
                    className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
                  >
                    Upload more
                  </button>
                  <Link
                    href="/"
                    className="text-xs bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusDot({ status }: { status: JobStatus }) {
  if (status === "done") return <span className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0" />;
  if (status === "error") return <span className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />;
  if (status === "needs_transcript") return <span className="mt-1 w-2 h-2 rounded-full bg-yellow-400 shrink-0" />;
  if (status === "processing") return <span className="mt-1 w-2 h-2 rounded-full bg-black animate-pulse shrink-0" />;
  return <span className="mt-1 w-2 h-2 rounded-full bg-gray-200 shrink-0" />;
}
