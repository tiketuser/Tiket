"use client";

import { useState } from "react";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

export default function MigratePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    if (!confirm("⚠️ This will restructure your database. Continue?")) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-to-concerts", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Migration failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Migration</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Migrate Tickets → Concerts + Tickets
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>This migration will:</strong>
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Backup existing tickets to "tickets_backup"</li>
              <li>Create "concerts" collection</li>
              <li>Group tickets by artist, date, and venue</li>
              <li>Generate 3-10 random tickets for each concert</li>
              <li>Create new "tickets" collection linked to concerts</li>
            </ul>
          </div>

          <button
            onClick={runMigration}
            disabled={isRunning}
            className={`w-full py-3 px-4 rounded font-medium ${
              isRunning
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <div className="loading loading-spinner loading-sm"></div>
                Running Migration...
              </span>
            ) : (
              "Run Migration"
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-sm font-semibold text-red-800">Error:</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded p-6">
            <p className="text-lg font-semibold text-green-800 mb-4">
              ✅ Migration Completed Successfully!
            </p>

            <div className="space-y-2 text-sm text-green-700">
              <p>
                <strong>Old tickets backed up:</strong>{" "}
                {result.stats?.oldTicketsBackedUp}
              </p>
              <p>
                <strong>Concerts created:</strong>{" "}
                {result.stats?.concertsCreated}
              </p>
              <p>
                <strong>New tickets generated:</strong>{" "}
                {result.stats?.newTicketsGenerated}
              </p>
              <p>
                <strong>Average tickets per concert:</strong>{" "}
                {result.stats?.averageTicketsPerConcert}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-xs text-green-600">
                💡 Old data is backed up in "tickets_backup" collection. You can
                delete it after verifying everything works.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
