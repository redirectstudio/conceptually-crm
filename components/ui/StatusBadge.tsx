import type { OutreachStatus } from "@/lib/types";

const STATUS_CONFIG: Record<OutreachStatus, { label: string; className: string }> = {
  not_contacted: { label: "Not Contacted", className: "bg-gray-100 text-gray-600" },
  reached_out: { label: "Reached Out", className: "bg-blue-50 text-blue-700" },
  responded: { label: "Responded", className: "bg-yellow-50 text-yellow-700" },
  meeting_booked: { label: "Meeting Booked", className: "bg-purple-50 text-purple-700" },
  converted: { label: "Converted", className: "bg-green-50 text-green-700" },
  not_a_fit: { label: "Not a Fit", className: "bg-red-50 text-red-500" },
};

export default function StatusBadge({ status }: { status: OutreachStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_contacted;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
