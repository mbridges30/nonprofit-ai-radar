"use client";
import { useState } from "react";

export default function KitSubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "You're subscribed!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-5 mb-4 sm:mb-6">
      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
        Stay current on AI in the nonprofit sector
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        A weekly digest of curated news and use cases for nonprofit leaders. Sent every Tuesday.
      </p>

      {status === "success" ? (
        <p className="text-sm text-[#4f8f9b] font-medium">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#4f8f9b] transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4f8f9b] hover:bg-[#3d7a85] rounded transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p className="text-xs text-red-500 mt-1">{message}</p>
      )}

      <p className="text-[11px] text-gray-400 mt-2">
        No spam. Unsubscribe anytime. We do not share subscriber data.
      </p>
    </div>
  );
}
