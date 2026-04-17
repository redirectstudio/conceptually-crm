"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Contact } from "@/lib/types";
import ContactCard from "@/components/ContactCard";

const SCORE_OPTIONS = ["All", "5", "4", "3", "2", "1"];
const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Not Contacted", value: "not_contacted" },
  { label: "Reached Out", value: "reached_out" },
  { label: "Responded", value: "responded" },
  { label: "Meeting Booked", value: "meeting_booked" },
  { label: "Converted", value: "converted" },
  { label: "Not a Fit", value: "not_a_fit" },
];
const STAGE_OPTIONS = [
  { label: "All Stages", value: "" },
  { label: "Idea", value: "idea" },
  { label: "Pre-Revenue", value: "pre_revenue" },
  { label: "Early Revenue", value: "early_revenue" },
  { label: "Growing", value: "growing" },
  { label: "Scaling", value: "scaling" },
];

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (scoreFilter !== "All") params.set("score", scoreFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (stageFilter) params.set("stage", stageFilter);

    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  }, [scoreFilter, statusFilter, stageFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const highPriority = contacts.filter((c) => (c.readiness_score ?? 0) >= 4);
  const rest = contacts.filter((c) => (c.readiness_score ?? 0) < 4);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">Conceptually CRM</h1>
            <p className="text-xs text-gray-400 mt-0.5">Extraordinary podcast pipeline</p>
          </div>
          <Link
            href="/add"
            className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Contact
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="flex items-center gap-8 mb-8 pb-6 border-b border-gray-100">
          <div>
            <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Contacts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{highPriority.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">High Priority (4–5)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {contacts.filter((c) => c.outreach_status === "converted").length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Converted</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {contacts.filter((c) => c.meeting_booked).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Meetings Booked</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
            {SCORE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setScoreFilter(s)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  scoreFilter === s
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s === "All" ? "All" : `${s}★`}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {(scoreFilter !== "All" || statusFilter || stageFilter) && (
            <button
              onClick={() => { setScoreFilter("All"); setStatusFilter(""); setStageFilter(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-gray-400">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-sm text-gray-500">No contacts yet.</p>
            <Link href="/add" className="text-sm font-medium text-black underline underline-offset-2">
              Add your first contact →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {highPriority.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  High Priority
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {highPriority.map((c) => <ContactCard key={c.id} contact={c} />)}
                </div>
              </section>
            )}
            {rest.length > 0 && (
              <section>
                {highPriority.length > 0 && (
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Pipeline
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rest.map((c) => <ContactCard key={c.id} contact={c} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
