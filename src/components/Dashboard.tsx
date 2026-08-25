"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import ShareDialog from "@/components/ShareDialog";
import type { CurrentUser, OwnedDocSummary, SharedDocSummary } from "@/lib/types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso)
  );
}

export default function Dashboard({
  currentUser,
  initialOwned,
  initialShared,
}: {
  currentUser: CurrentUser;
  initialOwned: OwnedDocSummary[];
  initialShared: SharedDocSummary[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [owned, setOwned] = useState(initialOwned);
  const [shared] = useState(initialShared);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sharingId, setSharingId] = useState<string | null>(null);

  async function createDoc() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the document.");
      router.push(`/docs/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setBusy(false);
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not import the file.");
      router.push(`/docs/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setBusy(false);
    }
  }

  async function commitRename(id: string) {
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title) return;
    setOwned((prev) => prev.map((d) => (d.id === id ? { ...d, title } : d)));
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document? This action cannot be undone.")) return;
    setOwned((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
  }

  return (
    <main className="min-h-screen">
      <header className="bg-paper/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-serif text-xl font-semibold text-ink">Ajaia Docs</h1>
          <UserMenu name={currentUser.name} email={currentUser.email} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={createDoc}
            disabled={busy}
            className="rounded-full bg-accent text-white text-sm font-medium px-4 py-2 transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            + New document
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="rounded-full bg-white text-ink text-sm font-medium px-4 py-2 shadow-softer transition-shadow duration-150 hover:shadow-soft disabled:opacity-50"
          >
            Import file (.txt, .md)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) importFile(file);
            }}
          />
        </div>

        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

        <section className="mb-10">
          <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-3">My documents</h2>
          {owned.length === 0 ? (
            <p className="text-sm text-ink-soft">No documents yet. Create your first one above.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {owned.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl shadow-softer p-4 flex flex-col gap-2 transition-shadow duration-150 hover:shadow-soft"
                >
                  {renamingId === doc.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(doc.id)}
                      onKeyDown={(e) => e.key === "Enter" && commitRename(doc.id)}
                      className="font-serif font-semibold text-sm border-b border-accent/40 focus:outline-none bg-transparent"
                    />
                  ) : (
                    <Link href={`/docs/${doc.id}`} className="font-serif font-semibold text-sm text-ink hover:text-accent-dark truncate transition-colors duration-150">
                      {doc.title}
                    </Link>
                  )}
                  <p className="text-xs text-ink-soft">Updated {formatDate(doc.updatedAt)}</p>
                  <div className="flex gap-3 text-xs mt-1">
                    <button
                      onClick={() => {
                        setRenamingId(doc.id);
                        setRenameValue(doc.title);
                      }}
                      className="text-ink-soft hover:text-ink transition-colors duration-150"
                    >
                      Rename
                    </button>
                    <button onClick={() => setSharingId(doc.id)} className="text-ink-soft hover:text-ink transition-colors duration-150">
                      Share
                    </button>
                    <button onClick={() => deleteDoc(doc.id)} className="text-red-700 hover:underline ml-auto">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-3">
            Shared with me
          </h2>
          {shared.length === 0 ? (
            <p className="text-sm text-ink-soft">No documents have been shared with you yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shared.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/docs/${doc.id}`}
                  className="bg-white rounded-2xl shadow-softer p-4 flex flex-col gap-2 transition-shadow duration-150 hover:shadow-soft"
                >
                  <span className="font-serif font-semibold text-sm text-ink truncate">{doc.title}</span>
                  <p className="text-xs text-ink-soft">
                    from {doc.owner.name} · {formatDate(doc.updatedAt)}
                  </p>
                  <span className="text-xs w-fit px-2.5 py-0.5 rounded-full bg-accent-tint text-accent-dark font-medium">
                    {doc.role === "EDIT" ? "Can edit" : "Can view"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {sharingId && <ShareDialog documentId={sharingId} onClose={() => setSharingId(null)} />}
    </main>
  );
}
