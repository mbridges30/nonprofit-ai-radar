"use client";

import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  let tags: string[] = [];
  try {
    tags = article.tags_json ? JSON.parse(article.tags_json) : [];
  } catch {
    tags = [];
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayDate =
    (article.published_at && formatDate(article.published_at)) ||
    formatDate(article.discovered_at) ||
    "Recent";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg border border-gray-100 hover:border-[#5f9ea0]/40 hover:bg-[#5f9ea0]/5 transition-all duration-150 group"
    >
      {/* Title + Relevance */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[13px] sm:text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#4a8284] transition-colors">
          {article.title}
        </h3>
        {article.relevance_score != null && article.relevance_score >= 40 && (
          <span
            className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1 ${
              article.relevance_score >= 80
                ? "bg-emerald-500"
                : article.relevance_score >= 60
                  ? "bg-orange-400"
                  : "bg-gray-300"
            }`}
            title={
              article.relevance_score >= 80
                ? "Highly relevant"
                : article.relevance_score >= 60
                  ? "Relevant"
                  : "Related"
            }
          />
        )}
      </div>

      {/* Summary */}
      {article.summary && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-2">
          {article.summary}
        </p>
      )}

      {/* Nonprofit Type + Geography + Tags */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2">
        <span className="bg-[#5f9ea0]/10 text-[#4a8284] px-2 py-0.5 rounded text-[10px] font-medium">
          {article.nonprofit_type || article.category}
        </span>
        {article.geography && article.geography !== "Global" && (
          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-medium">
            {article.geography}
          </span>
        )}
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Source + Date */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <span className="font-medium">{article.source_name}</span>
        <span>&middot;</span>
        <span>{displayDate}</span>
        <svg
          className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#5f9ea0]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
}
