import Link from "next/link";
import type { Contact } from "@/lib/types";
import ReadinessMeter from "./ReadinessMeter";
import StatusBadge from "./ui/StatusBadge";

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  pre_revenue: "Pre-Revenue",
  early_revenue: "Early Revenue",
  growing: "Growing",
  scaling: "Scaling",
};

export default function ContactCard({ contact }: { contact: Contact }) {
  const episodeDate = contact.podcast_date
    ? new Date(contact.podcast_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <Link href={`/contacts/${contact.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 hover:shadow-sm transition-all duration-150 cursor-pointer group">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-black">
              {contact.name}
            </h3>
            {contact.title && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{contact.title}</p>
            )}
          </div>
          <ReadinessMeter score={contact.readiness_score} size="sm" />
        </div>

        {/* Business info */}
        {contact.business_name && (
          <p className="text-xs font-medium text-gray-700 mb-1 truncate">{contact.business_name}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {contact.industry && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
              {contact.industry}
            </span>
          )}
          {contact.business_stage && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
              {STAGE_LABELS[contact.business_stage] ?? contact.business_stage}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <StatusBadge status={contact.outreach_status} />
          {episodeDate && (
            <span className="text-xs text-gray-400">{episodeDate}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
