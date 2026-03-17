"use client";

import { TIER_CONFIG } from "@/types";

interface TierLegendProps {
  counts: Record<string, number>;
}

export default function TierLegend({ counts }: TierLegendProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {Object.entries(TIER_CONFIG).map(([key, config]) => (
        <div key={key} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm text-gray-600">
            {config.label}{" "}
            <span className="text-gray-400">({counts[key] || 0})</span>
          </span>
        </div>
      ))}
    </div>
  );
}
