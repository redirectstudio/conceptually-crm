"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Contact, OutreachStatus } from "@/lib/types";
import ReadinessMeter from "@/components/ReadinessMeter";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_OPTIONS: { label: string; value: OutreachStatus }[] = [
  { label: "Not Contacted", value: "not_contacted" },
  { label: "Reached Out", value: "reached_out" },
  { label: "Responded", value: "responded" },
  { label: "Meeting Booked", value: "meeting_booked" },
  { label: "Converted", value: "converted" },
  { label: "Not a Fit", value: "not_a_fit" },
];

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage",
  pre_revenue: "Pre-Revenue",
  early_revenue: "Early Revenue",
  growing: "Growing",
  scaling: "Scaling",
};

export default function ContactProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outreachNotes, setOutreachNotes] = useState("");
  const [notesChanged, setNotesChanged] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setContact(d.contact);
        setOutreachNotes(d.contact?.outreach_notes ?? "");
        setLoading(false);
      });
  }, [id]);

  async function updateField(updates: Partial<Contact>) {
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setContact(data.contact);
    setSaving(false);
  }

  async function saveNotes() {
    await updateField({ outreach_notes: outreachNotes });
    setNotesChanged(false);
  }

  async function markContacted() {
    await updateField({ last_contacted: new Date().toISOString() });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Contact not found.</p>
        <Link href="/" className="text-sm font-medium text-black underline">← Dashboard</Link>
      </div>
    );
  }

  const episodeDate = contact.podcast_date
    ? new Date(contact.podcast_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const lastContacted = contact.last_contacted
    ? new Date(contact.last_contacted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            ← Dashboard
          </Link>
          {saving && <span className="text-xs text-gray-400">Saving...</span>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Hero card */}
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{contact.name}</h1>
              {contact.title && <p className="text-sm text-gray-500 mt-1">{contact.title}</p>}
              {contact.business_name && (
                <p className="text-sm font-medium text-gray-700 mt-1">{contact.business_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {contact.location && (
                  <span className="text-xs text-gray-500">📍 {contact.location}</span>
                )}
                {contact.industry && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                    {contact.industry}
                  </span>
                )}
                {contact.business_stage && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                    {STAGE_LABELS[contact.business_stage]}
                  </span>
                )}
                {contact.has_audience && contact.audience_size && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                    👥 {contact.audience_size}
                  </span>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <ReadinessMeter score={contact.readiness_score} size="lg" showLabel />
              {contact.readiness_reasoning && (
                <p className="text-xs text-gray-400 max-w-xs text-right leading-relaxed">
                  {contact.readiness_reasoning}
                </p>
              )}
            </div>
          </div>

          {/* Episode link */}
          {contact.episode_url && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <a
                href={contact.episode_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-black underline underline-offset-2 transition-colors"
              >
                {contact.episode_title ?? "View Episode"} ↗
              </a>
              {episodeDate && <span className="text-xs text-gray-400">{episodeDate}</span>}
            </div>
          )}
        </div>

        {/* Personal bio */}
        {contact.personal_bio && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Background</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">{contact.personal_bio}</p>
              {contact.childhood_notes && (
                <p className="text-sm text-gray-500 leading-relaxed">{contact.childhood_notes}</p>
              )}
            </div>
          </section>
        )}

        {/* Business summary */}
        {contact.business_summary && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Business</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{contact.business_summary}</p>
          </section>
        )}

        {/* Where we can help — highlighted */}
        {contact.where_we_can_help && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Where We Can Help
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed">{contact.where_we_can_help}</p>
            </div>
          </section>
        )}

        {/* Key quotes */}
        {contact.key_quotes && contact.key_quotes.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Key Quotes</h2>
            <div className="space-y-3">
              {contact.key_quotes.map((q, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-4">
                  <p className="text-sm text-gray-700 italic">&ldquo;{q.quote}&rdquo;</p>
                  {q.context && <p className="text-xs text-gray-400 mt-1">{q.context}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Outreach tracker */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Outreach</h2>
          <div className="border border-gray-200 rounded-xl p-5 space-y-5">
            {/* Status + toggles row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Status</label>
                <select
                  value={contact.outreach_status}
                  onChange={(e) => updateField({ outreach_status: e.target.value as OutreachStatus })}
                  className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Meeting Booked</label>
                <button
                  onClick={() => updateField({ meeting_booked: !contact.meeting_booked })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    contact.meeting_booked
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {contact.meeting_booked ? "✓ Booked" : "Not Booked"}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Converted</label>
                <button
                  onClick={() => updateField({ converted: !contact.converted })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    contact.converted
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {contact.converted ? "✓ Converted" : "Not Converted"}
                </button>
              </div>

              <div className="flex flex-col gap-1 ml-auto text-right">
                {lastContacted && (
                  <span className="text-xs text-gray-400">Last contacted: {lastContacted}</span>
                )}
                <button
                  onClick={markContacted}
                  className="text-xs text-gray-500 hover:text-black underline underline-offset-2 transition-colors"
                >
                  Mark contacted today
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400">Notes</label>
              <textarea
                value={outreachNotes}
                onChange={(e) => { setOutreachNotes(e.target.value); setNotesChanged(true); }}
                placeholder="Add notes about this contact..."
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 resize-none"
              />
              {notesChanged && (
                <div className="flex justify-end">
                  <button
                    onClick={saveNotes}
                    className="text-xs bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
