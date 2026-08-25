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
      if (!res.ok) throw new Error(data.error ?? "Não foi possível compartilhar.");
      setEmail("");
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível compartilhar.");
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Compartilhar documento</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 text-sm">
            Fechar
          </button>
        </div>

        <form onSubmit={addShare} className="flex gap-2 mb-4">
          <input
            type="email"
            required
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "VIEW" | "EDIT")}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="VIEW">Pode visualizar</option>
            <option value="EDIT">Pode editar</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-neutral-900 text-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Convidar
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {shares === null && <p className="text-sm text-neutral-500">Carregando…</p>}
          {shares?.length === 0 && (
            <p className="text-sm text-neutral-500">Ainda não compartilhado com ninguém.</p>
          )}
          {shares?.map((share) => (
            <div key={share.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
              <div>
                <p className="font-medium">{share.user.name}</p>
                <p className="text-neutral-500 text-xs">{share.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                  {share.role === "EDIT" ? "Pode editar" : "Pode visualizar"}
                </span>
                <button
                  onClick={() => removeShare(share.user.id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
