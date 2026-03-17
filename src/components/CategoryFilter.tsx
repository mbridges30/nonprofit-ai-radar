"use client";

import { CATEGORIES } from "@/types";

const SHORT_LABELS: Record<string, string> = {
  "Fundraising & Donor Relations": "Fundraising",
  "Program Delivery & Services": "Programs",
  "Operations & Admin": "Operations",
  "Marketing & Communications": "Marketing",
  "Advocacy & Policy": "Advocacy",
  "Volunteer Management": "Volunteers",
  "Data & Impact Measurement": "Data & Impact",
};

interface CategoryFilterProps {
  activeCategories: Set<string>;
  onToggle: (category: string) => void;
  onToggleAll: () => void;
}

export default function CategoryFilter({
  activeCategories,
  onToggle,
  onToggleAll,
}: CategoryFilterProps) {
  const allActive = activeCategories.size === CATEGORIES.length;

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      <button
        onClick={onToggleAll}
        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-150 ${
          allActive
            ? "bg-gray-900 text-white shadow-sm"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onToggle(cat)}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all duration-150 ${
            activeCategories.has(cat)
              ? "bg-[#5f9ea0] text-white shadow-sm"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          <span className="sm:hidden">{SHORT_LABELS[cat] || cat}</span>
          <span className="hidden sm:inline">{cat}</span>
        </button>
      ))}
    </div>
  );
}
