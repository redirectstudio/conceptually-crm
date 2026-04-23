"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "idle" | "processing" | "done" | "error" | "needs_transcript";

export default function AddContact() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");

  const isProcessing = step === "processing";
  const isValidUrl = url.includes("youtube.com") || url.includes("youtu.be");

  async function submit(useManual = false) {
    setError("");
    setStep("processing");

    try {
      const body: Record<string, string> = { youtube_url: url.trim() };
      if (useManual && manualTranscript.trim()) body.manual_transcript = manualTranscript.trim();

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setStep("error");
          setError(data.error);
          return;
        }
        if (res.status === 422 && data.no_captions) {
          setStep("needs_transcript");
          return;
        }
        setStep("error");
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setStep("done");
      setTimeout(() => router.push(`/contacts/${data.contact_id}`), 800);
    } catch {
      setStep("error");
      setError("Network error — please try again.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || isProcessing) return;
    submit(false);
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Contact</h1>
          <p className="text-sm text-gray-500 mt-2">
            Paste a YouTube link to an Extraordinary Stories episode. We&apos;ll transcribe it and build the profile automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-xs font-medium text-gray-500 mb-2">
              YouTube URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (step === "needs_transcript" || step === "error") setStep("idle");
              }}
              placeholder="https://youtube.com/watch?v=..."
              disabled={isProcessing || step === "done"}
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
            />
          </div>

          {step !== "needs_transcript" && (
            <button
              type="submit"
              disabled={!url.trim() || !isValidUrl || isProcessing || step === "done"}
              className="w-full bg-black text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : step === "done" ? "Profile created." : "Process Episode"}
            </button>
          )}
        </form>

        {isProcessing && (
          <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse shrink-0" />
            Transcribing and analyzing — this takes 15–25 seconds...
          </div>
        )}

        {step === "needs_transcript" && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Captions disabled on this video</p>
              <p className="text-xs text-yellow-700 mt-1">
                Paste the transcript below — open the video on YouTube, click <strong>...</strong> → <strong>Show transcript</strong>, copy all, paste here.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Transcript</label>
              <textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Paste the full transcript here..."
                rows={10}
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>
            <button
              onClick={() => submit(true)}
              disabled={!manualTranscript.trim() || isProcessing}
              className="w-full bg-black text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Build Profile from Transcript"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <span className="text-green-500">✓</span> Profile created — redirecting...
          </div>
        )}

        {step === "error" && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => { setStep("idle"); setError(""); }}
              className="text-xs text-red-500 underline mt-2"
            >
              Try again
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8">
          Auto-transcription works on most YouTube videos. For videos without captions, paste the transcript manually.
        </p>
      </main>
    </div>
  );
}
