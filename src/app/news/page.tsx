"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import NewsFilters from "@/components/NewsFilters";
import KitSubscribeForm from "@/components/KitSubscribeForm";
import Footer from "@/components/Footer";
import {
  NONPROFIT_TYPES,
  GEOGRAPHIES,
  type NewsArticle,
} from "@/types";

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [activeNonprofitTypes, setActiveNonprofitTypes] = useState<Set<string>>(
    new Set(NONPROFIT_TYPES)
  );
  const [activeGeographies, setActiveGeographies] = useState<Set<string>>(
    new Set(GEOGRAPHIES)
  );
  const [sortBy, setSortBy] = useState<"date" | "relevance">("date");
  const [minRelevance, setMinRelevance] = useState<number>(0);
  const [activeKeyword, setActiveKeyword] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?sort=${sortBy}&limit=${PAGE_SIZE}&offset=0`)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data);
        setHasMore(data.length === PAGE_SIZE);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load news:", err);
        setLoading(false);
      });
  }, [sortBy]);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    fetch(`/api/news?sort=${sortBy}&limit=${PAGE_SIZE}&offset=${articles.length}`)
      .then((r) => r.json())
      .then((data) => {
        setArticles((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error("Failed to load more:", err);
        setLoadingMore(false);
      });
  }, [sortBy, articles.length]);

  // Extract all keywords from articles, sorted by frequency
  const allKeywords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of articles) {
      let tags: string[] = [];
      try {
        tags = article.tags_json ? JSON.parse(article.tags_json) : [];
      } catch {
        tags = [];
      }
      for (const tag of tags) {
        const lower = tag.toLowerCase();
        counts.set(lower, (counts.get(lower) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count);
  }, [articles]);

  const handleToggleNonprofitType = useCallback((type: string) => {
    setActiveNonprofitTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleToggleAllNonprofitTypes = useCallback(() => {
    setActiveNonprofitTypes((prev) =>
      prev.size === NONPROFIT_TYPES.length
        ? new Set<string>()
        : new Set(NONPROFIT_TYPES)
    );
  }, []);

  const handleToggleGeography = useCallback((geo: string) => {
    setActiveGeographies((prev) => {
      const next = new Set(prev);
      if (next.has(geo)) next.delete(geo);
      else next.add(geo);
      return next;
    });
  }, []);

  const handleToggleAllGeographies = useCallback(() => {
    setActiveGeographies((prev) =>
      prev.size === GEOGRAPHIES.length
        ? new Set<string>()
        : new Set(GEOGRAPHIES)
    );
  }, []);


  const filteredArticles = articles.filter((a) => {
    if (!activeNonprofitTypes.has(a.nonprofit_type)) return false;
    if (!activeGeographies.has(a.geography)) return false;
    if ((a.relevance_score || 0) < minRelevance) return false;
    if (activeKeyword) {
      let tags: string[] = [];
      try {
        tags = a.tags_json ? JSON.parse(a.tags_json) : [];
      } catch {
        tags = [];
      }
      if (!tags.some((t) => t.toLowerCase() === activeKeyword)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            AI in Nonprofits News
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            AI-curated news about artificial intelligence in the nonprofit
            sector, updated daily.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5f9ea0]" />
            <span className="ml-3 text-gray-500">Loading news...</span>
          </div>
        ) : (
          <>
            <NewsFilters
              activeNonprofitTypes={activeNonprofitTypes}
              onToggleNonprofitType={handleToggleNonprofitType}
              onToggleAllNonprofitTypes={handleToggleAllNonprofitTypes}
              activeGeographies={activeGeographies}
              onToggleGeography={handleToggleGeography}
              onToggleAllGeographies={handleToggleAllGeographies}
              sortBy={sortBy}
              onSortChange={setSortBy}
              minRelevance={minRelevance}
              onMinRelevanceChange={setMinRelevance}
              allKeywords={allKeywords}
              activeKeyword={activeKeyword}
              onKeywordChange={setActiveKeyword}
            />

            <KitSubscribeForm />

            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">
                  {articles.length === 0
                    ? "No news articles yet. The news agent runs daily at 6 AM to collect articles."
                    : "No articles match the selected filters."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400">
                    {filteredArticles.length} article
                    {filteredArticles.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}

            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5 py-2 text-xs font-medium text-[#4a8284] bg-[#5f9ea0]/10 hover:bg-[#5f9ea0]/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#5f9ea0]" />
                      Loading...
                    </span>
                  ) : (
                    "Load More Articles"
                  )}
                </button>
              </div>
            )}

            <div className="mt-4 text-center text-[11px] text-gray-400">
              {articles.length} articles &middot;{" "}
              {allKeywords.length} keywords
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
