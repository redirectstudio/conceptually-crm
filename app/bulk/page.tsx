"use client";

import { useState } from "react";
import Link from "next/link";

type JobStatus = "pending" | "processing" | "done" | "error";

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

  function parseUrls(): string[] {
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.includes("youtube.com") || l.includes("youtu.be"));
  }

  const validCount = parseUrls().length;
  const started = jobs.length > 0;
  const allDone = started && jobs.every((j) => j.status === "done" || j.status === "error");

  function updateJob(index: number, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j, i) => (i === index ? { ...j, ...patch } : j)));
  }

  async function start() {
    const urls = parseUrls();
    if (!urls.length) return;

    const initial: Job[] = urls.map((url) => ({ url, status: "pending" }));
    setJobs(initial);
    setRunning(true);

    for (let i = 0; i < urls.length; i++) {
      updateJob(i, { status: "processing" });

      try {
        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtube_url: urls[i] }),
        });
        const data = await res.json();

        if (!res.ok) {
          updateJob(i, { status: "error", error: data.error ?? "Failed" });
        } else {
          updateJob(i, {
            status: "done",
            contactId: data.contact.id,
            contactName: data.contact.name,
          });
        }
      } catch {
        updateJob(i, { status: "error", error: "Network error" });
      }
    }

    setRunning(false);
  }

  function reset() {
    setJobs([]);
    setRaw("");
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
            Paste multiple YouTube URLs — one per line. We'll process them in order and build each profile automatically.
          </p>
        </div>

        {!started && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">YouTube URLs</label>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={"https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...\nhttps://youtu.be/..."}
                rows={10}
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 resize-none font-mono"
              />
              {validCount > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">{validCount} valid URL{validCount !== 1 ? "s" : ""} detected</p>
              )}
            </div>
            <button
              onClick={start}
              disabled={validCount === 0}
              className="w-full bg-black text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Process {validCount > 0 ? `${validCount} Episode${validCount !== 1 ? "s" : ""}` : "Episodes"}
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
                </div>
              </div>
            ))}

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

            {running && (
              <p className="text-xs text-gray-400 pt-2">
                Processing sequentially — this takes ~30s per episode. Don&apos;t close this tab.
              </p>
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
  if (status === "processing") return <span className="mt-1 w-2 h-2 rounded-full bg-black animate-pulse shrink-0" />;
  return <span className="mt-1 w-2 h-2 rounded-full bg-gray-200 shrink-0" />;
}
