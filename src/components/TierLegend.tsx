"use client";

import { TIER_CONFIG } from "@/types";

interface TierLegendProps {
  counts: Record<string, number>;
}

export default function TierLegend({ counts }: TierLegendProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {Object.entries(TIER_CONFIG).map(([key, config]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-xs text-gray-500">
            {config.label}
            <span className="text-gray-400 ml-0.5">({counts[key] || 0})</span>
          </span>
        </div>
      ))}
    </div>
  );
}
