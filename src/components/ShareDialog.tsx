"use client";

import { useEffect, useState } from "react";
import type { ShareEntry } from "@/lib/types";

export default function ShareDialog({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [shares, setShares] = useState<ShareEntry[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEW" | "EDIT">("VIEW");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadShares() {
    const res = await fetch(`/api/documents/${documentId}/share`);
    const data = await res.json();
    if (res.ok) setShares(data.shares);
  }

  useEffect(() => {
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not share the document.");
      setEmail("");
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share the document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeShare(userId: string) {
    await fetch(`/api/documents/${documentId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await loadShares();
  }

  return (
    <div className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] flex items-center justify-center z-50 px-4 animate-[fade-in_150ms_ease-out]">
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 animate-[dialog-in_200ms_cubic-bezier(0.2,0,0,1)]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif font-semibold text-lg text-ink">Share document</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink transition-colors duration-150 text-sm">
            Close
          </button>
        </div>

        <form onSubmit={addShare} className="flex gap-2 mb-4">
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-xl border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors duration-150"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "VIEW" | "EDIT")}
            className="rounded-xl border border-line bg-paper px-2 py-1.5 text-sm text-ink"
          >
            <option value="VIEW">Can view</option>
            <option value="EDIT">Can edit</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent text-white px-4 py-1.5 text-sm font-medium transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            Invite
          </button>
        </form>
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {shares === null && <p className="text-sm text-ink-soft">Loading…</p>}
          {shares?.length === 0 && (
            <p className="text-sm text-ink-soft">Not shared with anyone yet.</p>
          )}
          {shares?.map((share) => (
            <div key={share.id} className="flex items-center justify-between text-sm bg-paper rounded-xl px-3.5 py-2.5">
              <div>
                <p className="font-medium text-ink">{share.user.name}</p>
                <p className="text-ink-soft text-xs">{share.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-tint text-accent-dark font-medium">
                  {share.role === "EDIT" ? "Can edit" : "Can view"}
                </span>
                <button
                  onClick={() => removeShare(share.user.id)}
                  className="text-red-700 hover:underline text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
