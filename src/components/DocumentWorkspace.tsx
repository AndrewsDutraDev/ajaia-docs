"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Editor from "@/components/Editor";
import ShareDialog from "@/components/ShareDialog";
import UserMenu from "@/components/UserMenu";
import type { CurrentUser } from "@/lib/types";

type Role = "OWNER" | "EDIT" | "VIEW";
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function DocumentWorkspace({
  documentId,
  initialTitle,
  initialContentHtml,
  role,
  ownerLabel,
  currentUser,
}: {
  documentId: string;
  initialTitle: string;
  initialContentHtml: string;
  role: Role;
  ownerLabel: string | null;
  currentUser: CurrentUser;
}) {
  const canEdit = role === "OWNER" || role === "EDIT";
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);

  const save = useCallback(
    async (patch: { title?: string; contentHtml?: string }) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error();
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [documentId]
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/docs" className="text-sm text-neutral-500 hover:text-neutral-900 shrink-0">
              ← Documentos
            </Link>
            <input
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => canEdit && title.trim() && save({ title: title.trim() })}
              className="font-semibold text-lg bg-transparent focus:outline-none focus:bg-neutral-100 rounded px-1.5 py-0.5 min-w-0 truncate disabled:text-neutral-700"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <SaveIndicator status={status} />
            {role === "VIEW" && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">Somente leitura</span>
            )}
            {ownerLabel && <span className="text-xs text-neutral-500 hidden sm:inline">de {ownerLabel}</span>}
            {role === "OWNER" && (
              <button
                onClick={() => setShareOpen(true)}
                className="text-sm rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
              >
                Compartilhar
              </button>
            )}
            <UserMenu name={currentUser.name} email={currentUser.email} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Editor
          initialContentHtml={initialContentHtml}
          editable={canEdit}
          onChange={(html) => save({ contentHtml: html })}
        />
      </div>

      {shareOpen && <ShareDialog documentId={documentId} onClose={() => setShareOpen(false)} />}
    </main>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const text =
    status === "saving" ? "Salvando…" : status === "saved" ? "Salvo" : status === "error" ? "Erro ao salvar" : "";
  if (!text) return null;
  return (
    <span className={`text-xs ${status === "error" ? "text-red-600" : "text-neutral-500"}`}>{text}</span>
  );
}
