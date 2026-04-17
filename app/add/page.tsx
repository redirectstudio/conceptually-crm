"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "idle" | "transcribing" | "analyzing" | "saving" | "done" | "error";

const STEP_MESSAGES: Record<Step, string> = {
  idle: "",
  transcribing: "Fetching transcript from YouTube...",
  analyzing: "Analyzing with Claude AI...",
  saving: "Building profile...",
  done: "Profile created.",
  error: "",
};

export default function AddContact() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");

  const isProcessing = step === "transcribing" || step === "analyzing" || step === "saving";
  const isValidUrl = url.includes("youtube.com") || url.includes("youtu.be");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || isProcessing) return;

    setError("");
    setStep("transcribing");

    // Simulate step progression for UX
    const stepTimer1 = setTimeout(() => setStep("analyzing"), 4000);
    const stepTimer2 = setTimeout(() => setStep("saving"), 12000);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: url.trim() }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await res.json();

      if (!res.ok) {
        setStep("error");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStep("done");
      setTimeout(() => {
        router.push(`/contacts/${data.contact.id}`);
      }, 800);
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setStep("error");
      setError("Network error — please try again.");
    }
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
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={isProcessing || step === "done"}
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!url.trim() || !isValidUrl || isProcessing || step === "done"}
            className="w-full bg-black text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing || step === "done" ? STEP_MESSAGES[step] : "Process Episode"}
          </button>
        </form>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3">
              <StepDot active={step === "transcribing"} done={["analyzing", "saving"].includes(step)} />
              <span className={`text-sm ${step === "transcribing" ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                Fetching transcript
              </span>
            </div>
            <div className="flex items-center gap-3">
              <StepDot active={step === "analyzing"} done={step === "saving"} />
              <span className={`text-sm ${step === "analyzing" ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                Analyzing with Claude
              </span>
            </div>
            <div className="flex items-center gap-3">
              <StepDot active={step === "saving"} done={false} />
              <span className={`text-sm ${step === "saving" ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                Building profile
              </span>
            </div>
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
          Works with any YouTube video that has auto-generated or manual captions. Most Extraordinary Stories episodes qualify.
        </p>
      </main>
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  if (done) return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />;
  if (active) return (
    <span className="w-2 h-2 rounded-full bg-black shrink-0 animate-pulse" />
  );
  return <span className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />;
}
