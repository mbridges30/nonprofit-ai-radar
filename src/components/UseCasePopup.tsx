"use client";

import { TIER_CONFIG, type UseCase, type Tier } from "@/types";

interface UseCasePopupProps {
  useCase: UseCase | null;
  onClose: () => void;
}

export default function UseCasePopup({ useCase, onClose }: UseCasePopupProps) {
  if (!useCase) return null;

  const tierConfig = TIER_CONFIG[useCase.tier as Tier];
  let exampleOrgs: string[] = [];
  try {
    exampleOrgs = useCase.example_orgs ? JSON.parse(useCase.example_orgs) : [];
  } catch {
    exampleOrgs = [];
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-2">
                {useCase.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white tracking-wide"
                  style={{ backgroundColor: tierConfig.color }}
                >
                  {tierConfig.label}
                </span>
                <span className="text-sm font-medium text-gray-500">
                  {useCase.score}/100
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Category & Date */}
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
              {useCase.category}
            </span>
            <span>&middot;</span>
            <span>{useCase.date_found}</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {useCase.description}
          </p>

          {/* Implementation Notes */}
          {useCase.implementation_notes && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200/60 rounded-lg p-3.5">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                How to Get Started
              </h3>
              <p className="text-emerald-700 text-sm leading-relaxed">
                {useCase.implementation_notes}
              </p>
            </div>
          )}

          {/* Example Organizations */}
          {exampleOrgs.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Who&apos;s Using This
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {exampleOrgs.map((org: string, i: number) => (
                  <span
                    key={i}
                    className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-medium"
                  >
                    {org}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source Link */}
          {useCase.source_url && (
            <div className="pt-3 border-t border-gray-100">
              <a
                href={useCase.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-[#5f9ea0] hover:text-[#4a8284] font-medium"
              >
                {useCase.source_name || "View source"}
                <svg
                  className="w-3.5 h-3.5 ml-1"
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
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
