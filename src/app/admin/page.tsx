"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import type { AgentRun, NewsAgentRun } from "@/types";

export default function AdminPage() {
  const [radarRuns, setRadarRuns] = useState<AgentRun[]>([]);
  const [newsRuns, setNewsRuns] = useState<NewsAgentRun[]>([]);
  const [radarRunning, setRadarRunning] = useState(false);
  const [newsRunning, setNewsRunning] = useState(false);
  const [radarMessage, setRadarMessage] = useState("");
  const [newsMessage, setNewsMessage] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    loadRadarRuns();
    loadNewsRuns();
  }, []);

  async function loadRadarRuns() {
    try {
      const res = await fetch("/api/agent/status");
      setRadarRuns(await res.json());
    } catch (err) {
      console.error("Failed to load radar runs:", err);
    }
  }

  async function loadNewsRuns() {
    try {
      const res = await fetch("/api/news-agent/status");
      setNewsRuns(await res.json());
    } catch (err) {
      console.error("Failed to load news runs:", err);
    }
  }

  async function triggerRadarAgent() {
    setRadarRunning(true);
    setRadarMessage("Agent is running... This may take a minute.");
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agent-secret": secret },
      });
      const data = await res.json();
      if (res.ok) {
        setRadarMessage(`Completed! Found ${data.casesFound} new use case(s). Run ID: ${data.runId}`);
      } else {
        setRadarMessage(`Error: ${data.error}`);
      }
      loadRadarRuns();
    } catch (err) {
      setRadarMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setRadarRunning(false);
    }
  }

  async function triggerNewsAgent() {
    setNewsRunning(true);
    setNewsMessage("Agent is running... This may take a minute.");
    try {
      const res = await fetch("/api/news-agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agent-secret": secret },
      });
      const data = await res.json();
      if (res.ok) {
        setNewsMessage(`Completed! Found ${data.articlesFound} new article(s). Run ID: ${data.runId}`);
      } else {
        setNewsMessage(`Error: ${data.error}`);
      }
      loadNewsRuns();
    } catch (err) {
      setNewsMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setNewsRunning(false);
    }
  }

  function statusBadge(status: string) {
    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          status === "completed"
            ? "bg-green-100 text-green-700"
            : status === "running"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
        }`}
      >
        {status}
      </span>
    );
  }

  function messageBanner(msg: string) {
    if (!msg) return null;
    return (
      <div
        className={`text-sm p-3 rounded-lg mt-4 ${
          msg.includes("Error")
            ? "bg-red-50 text-red-700"
            : msg.includes("running")
              ? "bg-yellow-50 text-yellow-700"
              : "bg-green-50 text-green-700"
        }`}
      >
        {msg}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Agent Admin</h2>
        <p className="text-sm text-gray-500 mb-6">
          Manually trigger agents and view run history.
        </p>

        {/* Shared Secret Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-xs text-gray-500 mb-1">
            Agent Secret
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter your AGENT_SECRET"
            className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Two-column agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Agent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                AI Use Cases Agent
              </h3>
              <button
                onClick={triggerRadarAgent}
                disabled={radarRunning}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${
                  radarRunning
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#5f9ea0] hover:bg-[#4a8284]"
                }`}
              >
                {radarRunning ? "Running..." : "Run Now"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Searches for new nonprofit AI use cases, scores them, and adds to the radar.
            </p>

            {messageBanner(radarMessage)}

            <h4 className="text-xs font-medium text-gray-500 mt-4 mb-2">
              Run History
            </h4>
            {radarRuns.length === 0 ? (
              <p className="text-xs text-gray-400">No runs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 text-gray-500 font-medium">Started</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">Found</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radarRuns.map((run) => (
                      <tr key={run.id} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-600">
                          {new Date(run.started_at).toLocaleString()}
                        </td>
                        <td className="py-1.5">{statusBadge(run.status)}</td>
                        <td className="py-1.5 text-gray-600">{run.cases_found}</td>
                        <td className="py-1.5 text-red-500 max-w-[120px] truncate">
                          {run.error || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* News Agent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                AI News Agent
              </h3>
              <button
                onClick={triggerNewsAgent}
                disabled={newsRunning}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${
                  newsRunning
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#5f9ea0] hover:bg-[#4a8284]"
                }`}
              >
                {newsRunning ? "Running..." : "Run Now"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Collects AI-in-nonprofit news from Brave, Google Alerts, and RSS feeds, then analyzes with Claude.
            </p>

            {messageBanner(newsMessage)}

            <h4 className="text-xs font-medium text-gray-500 mt-4 mb-2">
              Run History
            </h4>
            {newsRuns.length === 0 ? (
              <p className="text-xs text-gray-400">No runs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 text-gray-500 font-medium">Started</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">Found</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsRuns.map((run) => (
                      <tr key={run.id} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-600">
                          {new Date(run.started_at).toLocaleString()}
                        </td>
                        <td className="py-1.5">{statusBadge(run.status)}</td>
                        <td className="py-1.5 text-gray-600">{run.articles_found}</td>
                        <td className="py-1.5 text-red-500 max-w-[120px] truncate">
                          {run.error || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
