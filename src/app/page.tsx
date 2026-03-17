"use client";

import { useEffect, useState, useCallback } from "react";
import RadarChart from "@/components/RadarChart";
import UseCasePopup from "@/components/UseCasePopup";
import CategoryFilter from "@/components/CategoryFilter";
import TierLegend from "@/components/TierLegend";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CATEGORIES, type UseCase } from "@/types";

export default function Home() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(CATEGORIES)
  );
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "score">("score");

  useEffect(() => {
    fetch("/api/use-cases")
      .then((r) => r.json())
      .then((data) => {
        setUseCases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load use cases:", err);
        setLoading(false);
      });
  }, []);

  const handleToggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setActiveCategories((prev) =>
      prev.size === CATEGORIES.length ? new Set<string>() : new Set(CATEGORIES)
    );
  }, []);

  const handleUseCaseClick = useCallback((uc: UseCase) => {
    setSelectedUseCase(uc);
  }, []);

  const tierCounts = useCases.reduce(
    (acc, uc) => {
      if (activeCategories.has(uc.category)) {
        acc[uc.tier] = (acc[uc.tier] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const filteredList = useCases
    .filter((uc) => activeCategories.has(uc.category))
    .sort((a, b) => {
      if (sortBy === "date") return b.date_found.localeCompare(a.date_found);
      return b.score - a.score;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5f9ea0]" />
            <span className="ml-3 text-gray-500">Loading use cases...</span>
          </div>
        ) : (
          <>
            {/* Filters + Legend row */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4 sm:mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryFilter
                  activeCategories={activeCategories}
                  onToggle={handleToggleCategory}
                  onToggleAll={handleToggleAll}
                />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "date" | "score")
                  }
                  className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-600 bg-gray-50"
                >
                  <option value="score">Sort by Score</option>
                  <option value="date">Sort by Date</option>
                </select>
                <div className="ml-auto">
                  <TierLegend counts={tierCounts} />
                </div>
              </div>
            </div>

            {/* Radar + List */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
              {/* Radar Chart */}
              <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
                <p className="text-center text-[11px] text-gray-400 mb-1">
                  Click any dot for details &middot; Inner = Ready Now &middot; Outer = Advanced Impact
                </p>
                <RadarChart
                  useCases={useCases}
                  activeCategories={activeCategories}
                  onUseCaseClick={handleUseCaseClick}
                />
              </div>

              {/* Use Case List */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-800">
                    Use Cases
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      {filteredList.length}
                    </span>
                  </h2>
                </div>
                <div className="space-y-2 max-h-[420px] sm:max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredList.map((uc) => (
                    <button
                      key={uc.id}
                      onClick={() => setSelectedUseCase(uc)}
                      className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#5f9ea0]/40 hover:bg-[#5f9ea0]/5 transition-all duration-150 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#4a8284] transition-colors">
                          {uc.title}
                        </h3>
                        <span
                          className="shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                          style={{
                            backgroundColor:
                              uc.tier === "ready_now"
                                ? "#22c55e"
                                : uc.tier === "strategic_growth"
                                  ? "#eab308"
                                  : "#3b82f6",
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {uc.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-medium text-gray-400">
                          {uc.score}
                        </span>
                        <span className="text-[10px] text-gray-300">&bull;</span>
                        <span className="text-[11px] text-gray-400">
                          {uc.date_found}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-[11px] text-gray-400">
              {useCases.length} use cases across {CATEGORIES.length} categories
            </div>
          </>
        )}
      </main>

      <Footer />

      <UseCasePopup
        useCase={selectedUseCase}
        onClose={() => setSelectedUseCase(null)}
      />
    </div>
  );
}
