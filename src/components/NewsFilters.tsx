"use client";

import { useState, useRef, useEffect } from "react";
import { NONPROFIT_TYPES, GEOGRAPHIES } from "@/types";

interface FilterDropdownProps {
  label: string;
  options: readonly string[];
  activeOptions: Set<string>;
  onToggle: (option: string) => void;
  onToggleAll: () => void;
}

function FilterDropdown({
  label,
  options,
  activeOptions,
  onToggle,
  onToggleAll,
}: FilterDropdownProps) {
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

  const allActive = activeOptions.size === options.length;
  const count = activeOptions.size;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1.5 transition-all ${
          !allActive
            ? "border-[#5f9ea0]/40 bg-[#5f9ea0]/5 text-[#4a8284]"
            : "border-gray-200 text-gray-600 bg-gray-50 hover:border-gray-300"
        }`}
      >
        <span>{label}</span>
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[280px] overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={allActive}
              onChange={onToggleAll}
              className="rounded border-gray-300 text-[#5f9ea0] focus:ring-[#5f9ea0]"
            />
            <span className="text-xs font-semibold text-gray-700">All</span>
          </label>
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={activeOptions.has(option)}
                onChange={() => onToggle(option)}
                className="rounded border-gray-300 text-[#5f9ea0] focus:ring-[#5f9ea0]"
              />
              <span className="text-xs text-gray-600">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface KeywordDropdownProps {
  allKeywords: { keyword: string; count: number }[];
  activeKeyword: string;
  onSelect: (keyword: string) => void;
}

function KeywordDropdown({ allKeywords, activeKeyword, onSelect }: KeywordDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filtered = search
    ? allKeywords.filter((k) => k.keyword.toLowerCase().includes(search.toLowerCase()))
    : allKeywords;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1.5 transition-all ${
          activeKeyword
            ? "border-[#5f9ea0]/40 bg-[#5f9ea0]/5 text-[#4a8284]"
            : "border-gray-200 text-gray-600 bg-gray-50 hover:border-gray-300"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>{activeKeyword || "Keyword"}</span>
        {activeKeyword && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onSelect("");
              setIsOpen(false);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[220px] max-h-[320px] flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keywords..."
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#5f9ea0]"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {activeKeyword && (
              <button
                onClick={() => {
                  onSelect("");
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
              >
                Clear filter
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No matching keywords</div>
            ) : (
              filtered.slice(0, 30).map(({ keyword, count }) => (
                <button
                  key={keyword}
                  onClick={() => {
                    onSelect(keyword);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between ${
                    activeKeyword === keyword ? "bg-[#5f9ea0]/5 text-[#4a8284] font-medium" : "text-gray-600"
                  }`}
                >
                  <span>{keyword}</span>
                  <span className="text-[10px] text-gray-400">{count}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NewsFiltersProps {
  activeNonprofitTypes: Set<string>;
  onToggleNonprofitType: (type: string) => void;
  onToggleAllNonprofitTypes: () => void;
  activeGeographies: Set<string>;
  onToggleGeography: (geo: string) => void;
  onToggleAllGeographies: () => void;
  sortBy: "date" | "relevance";
  onSortChange: (sort: "date" | "relevance") => void;
  minRelevance: number;
  onMinRelevanceChange: (value: number) => void;
  allKeywords: { keyword: string; count: number }[];
  activeKeyword: string;
  onKeywordChange: (keyword: string) => void;
}

export default function NewsFilters({
  activeNonprofitTypes,
  onToggleNonprofitType,
  onToggleAllNonprofitTypes,
  activeGeographies,
  onToggleGeography,
  onToggleAllGeographies,
  sortBy,
  onSortChange,
  minRelevance,
  onMinRelevanceChange,
  allKeywords,
  activeKeyword,
  onKeywordChange,
}: NewsFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4 sm:mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Nonprofit Type"
          options={NONPROFIT_TYPES}
          activeOptions={activeNonprofitTypes}
          onToggle={onToggleNonprofitType}
          onToggleAll={onToggleAllNonprofitTypes}
        />
        <FilterDropdown
          label="Geography"
          options={GEOGRAPHIES}
          activeOptions={activeGeographies}
          onToggle={onToggleGeography}
          onToggleAll={onToggleAllGeographies}
        />
        <KeywordDropdown
          allKeywords={allKeywords}
          activeKeyword={activeKeyword}
          onSelect={onKeywordChange}
        />
        <select
          value={minRelevance}
          onChange={(e) => onMinRelevanceChange(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-600 bg-gray-50"
        >
          <option value={0}>All Articles</option>
          <option value={60}>Relevant & Above</option>
          <option value={80}>Highly Relevant Only</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) =>
            onSortChange(e.target.value as "date" | "relevance")
          }
          className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-600 bg-gray-50"
        >
          <option value="date">Newest First</option>
          <option value="relevance">Most Relevant</option>
        </select>
      </div>
    </div>
  );
}
