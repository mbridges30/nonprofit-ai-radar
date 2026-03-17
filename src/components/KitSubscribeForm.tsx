"use client";
import { useEffect, useRef } from "react";

export default function KitSubscribeForm() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector("script")) return;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.uid = "7dcdb9d4be";
    script.src = "https://bridges-strategy.kit.com/7dcdb9d4be/index.js";
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-5 mb-4 sm:mb-6">
      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
        Stay current on AI in the nonprofit sector
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        A weekly digest of curated news and use cases for nonprofit leaders. Sent every Tuesday.
      </p>
      <div ref={containerRef} />
      <p className="text-[11px] text-gray-400 mt-2">
        No spam. Unsubscribe anytime. We do not share subscriber data.
      </p>
    </div>
  );
}
