"use client";

import { useState, useRef, useEffect } from "react";
import { CATEGORIES } from "@/types";

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
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const allActive = activeCategories.size === CATEGORIES.length;
  const count = activeCategories.size;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1.5 transition-all ${
          !allActive
            ? "border-[#5f9ea0]/40 bg-[#5f9ea0]/5 text-[#4a8284]"
            : "border-gray-200 text-gray-600 bg-gray-50 hover:border-gray-300"
        }`}
      >
        <span>Category</span>
        {!allActive && (
          <span className="bg-[#5f9ea0] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {count}
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[240px] max-h-[320px] overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={allActive}
              onChange={onToggleAll}
              className="rounded border-gray-300 text-[#5f9ea0] focus:ring-[#5f9ea0]"
            />
            <span className="text-xs font-semibold text-gray-700">All Categories</span>
          </label>
          {CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={activeCategories.has(cat)}
                onChange={() => onToggle(cat)}
                className="rounded border-gray-300 text-[#5f9ea0] focus:ring-[#5f9ea0]"
              />
              <span className="text-xs text-gray-600">{cat}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
