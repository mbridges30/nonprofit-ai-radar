"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#5f9ea0] rounded-lg flex items-center justify-center">
                {/* Radar icon */}
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                >
                  <circle cx="12" cy="12" r="9" strokeDasharray="4,3" />
                  <circle cx="12" cy="12" r="5" strokeDasharray="3,2" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  <line x1="12" y1="12" x2="12" y2="3" strokeLinecap="round" />
                  <line x1="12" y1="12" x2="18.5" y2="8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight">
                  Nonprofit AI Radar
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                  Discover what&apos;s possible with AI in the social sector
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  pathname === "/"
                    ? "bg-[#5f9ea0]/10 border-[#5f9ea0]/40 text-[#4a8284] shadow-sm"
                    : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold">AI Use Cases</span>
                <span className="hidden sm:block text-[10px] text-gray-400 leading-tight">
                  Interactive use case map
                </span>
              </Link>
              <Link
                href="/news"
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  pathname === "/news"
                    ? "bg-[#5f9ea0]/10 border-[#5f9ea0]/40 text-[#4a8284] shadow-sm"
                    : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold">AI News</span>
                <span className="hidden sm:block text-[10px] text-gray-400 leading-tight">
                  Latest stories &amp; trends
                </span>
              </Link>
            </nav>
          </div>

          <a
            href="https://bridgesstrategy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#4f8f9b] hover:bg-[#3d7a85] rounded transition-colors"
          >
            &larr; Back to Bridges Strategy
          </a>
        </div>
      </div>
    </header>
  );
}
