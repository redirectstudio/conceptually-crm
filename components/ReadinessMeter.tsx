"use client";

interface ReadinessMeterProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SCORE_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const SCORE_LABELS = ["", "Early Stage", "Building", "Active", "Ready", "Hot Lead"];

export default function ReadinessMeter({ score, size = "md", showLabel = false }: ReadinessMeterProps) {
  const barCount = 5;
  const activeScore = score ?? 0;

  const barHeight = size === "sm" ? "h-2" : size === "lg" ? "h-5" : "h-3";
  const barWidth = size === "sm" ? "w-3" : size === "lg" ? "w-6" : "w-4";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";
  const labelSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-end ${gap}`}>
        {Array.from({ length: barCount }, (_, i) => {
          const barScore = i + 1;
          const isActive = activeScore >= barScore;
          const color = isActive ? SCORE_COLORS[activeScore - 1] : "#e5e7eb";
          const heightClass =
            size === "sm"
              ? i === 0 ? "h-1.5" : i === 1 ? "h-2" : i === 2 ? "h-2.5" : i === 3 ? "h-3" : "h-3.5"
              : size === "lg"
              ? i === 0 ? "h-3" : i === 1 ? "h-4" : i === 2 ? "h-5" : i === 3 ? "h-6" : "h-7"
              : i === 0 ? "h-2" : i === 1 ? "h-3" : i === 2 ? "h-4" : i === 3 ? "h-5" : "h-6";

          return (
            <div
              key={i}
              className={`${barWidth} ${heightClass} rounded-sm transition-all duration-200`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className={`${labelSize} font-medium`} style={{ color: activeScore > 0 ? SCORE_COLORS[activeScore - 1] : "#9ca3af" }}>
          {activeScore > 0 ? SCORE_LABELS[activeScore] : "Unscored"}
        </span>
      )}
    </div>
  );
}
