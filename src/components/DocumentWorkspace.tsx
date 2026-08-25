"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import Editor from "@/components/Editor";
import ShareDialog from "@/components/ShareDialog";
import UserMenu from "@/components/UserMenu";
import type { CurrentUser } from "@/lib/types";

type Role = "OWNER" | "EDIT" | "VIEW";
type SaveStatus = "idle" | "saving" | "saved" | "error";
type Viewer = { id: string; name: string; isSelf: boolean };

const POLL_INTERVAL_MS = 3500;

export default function DocumentWorkspace({
  documentId,
  initialTitle,
  initialContentHtml,
  initialUpdatedAt,
  role,
  ownerLabel,
  currentUser,
}: {
  documentId: string;
  initialTitle: string;
  initialContentHtml: string;
  initialUpdatedAt: string;
  role: Role;
  ownerLabel: string | null;
  currentUser: CurrentUser;
}) {
  const canEdit = role === "OWNER" || role === "EDIT";
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [remoteContentHtml, setRemoteContentHtml] = useState<string | undefined>(undefined);

  const editorRef = useRef<TiptapEditor | null>(null);
  const titleFocusedRef = useRef(false);
  const lastKnownUpdatedAtRef = useRef(initialUpdatedAt);

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
        const data = await res.json();
        lastKnownUpdatedAtRef.current = data.document.updatedAt;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [documentId]
  );

  // Presence heartbeat + live content sync, polled every few seconds (no WebSocket infra on serverless Vercel).
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const [presRes, docRes] = await Promise.all([
          fetch(`/api/documents/${documentId}/presence`, { method: "POST" }),
          fetch(`/api/documents/${documentId}`),
        ]);
        if (cancelled) return;

        if (presRes.ok) {
          const data = await presRes.json();
          setViewers(data.viewers);
        }

        if (docRes.ok) {
          const data = await docRes.json();
          const doc = data.document;
          if (doc.updatedAt !== lastKnownUpdatedAtRef.current) {
            lastKnownUpdatedAtRef.current = doc.updatedAt;
            const editedBy = doc.lastEditedBy as { id: string; name: string } | null;
            if (editedBy && editedBy.id !== currentUser.id) {
              setRemoteContentHtml(doc.contentHtml);
              if (!titleFocusedRef.current) setTitle(doc.title);
              setLiveNotice(`Updated by ${editedBy.name}`);
            }
          }
        }
      } catch {
        // Transient network hiccup — the next poll will retry.
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [documentId, currentUser.id]);

  // Best-effort "I left" signal so stale viewers don't linger in the presence list.
  useEffect(() => {
    function leave() {
      fetch(`/api/documents/${documentId}/presence`, { method: "DELETE", keepalive: true }).catch(() => {});
    }
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [documentId]);

  useEffect(() => {
    if (!liveNotice) return;
    const timer = setTimeout(() => setLiveNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [liveNotice]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/docs" className="text-sm text-neutral-500 hover:text-neutral-900 shrink-0">
              ← Documents
            </Link>
            <input
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => (titleFocusedRef.current = true)}
              onBlur={() => {
                titleFocusedRef.current = false;
                if (canEdit && title.trim()) save({ title: title.trim() });
              }}
              className="font-semibold text-lg bg-transparent focus:outline-none focus:bg-neutral-100 rounded px-1.5 py-0.5 min-w-0 truncate disabled:text-neutral-700"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {liveNotice && <span className="text-xs text-blue-600 hidden md:inline">{liveNotice}</span>}
            <ViewerBar viewers={viewers} />
            <SaveIndicator status={status} />
            {role === "VIEW" && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">Read-only</span>
            )}
            {ownerLabel && <span className="text-xs text-neutral-500 hidden sm:inline">from {ownerLabel}</span>}
            <ExportMenu documentId={documentId} />
            {role === "OWNER" && (
              <button
                onClick={() => setShareOpen(true)}
                className="text-sm rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
              >
                Share
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
          onEditorReady={(editor) => (editorRef.current = editor)}
          remoteContentHtml={remoteContentHtml}
        />
      </div>

      {shareOpen && <ShareDialog documentId={documentId} onClose={() => setShareOpen(false)} />}
    </main>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const text =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Error saving" : "";
  if (!text) return null;
  return (
    <span className={`text-xs ${status === "error" ? "text-red-600" : "text-neutral-500"}`}>{text}</span>
  );
}

function ViewerBar({ viewers }: { viewers: Viewer[] }) {
  if (viewers.length <= 1) return null;
  const label = viewers.map((v) => (v.isSelf ? "You" : v.name)).join(", ");
  return (
    <span
      className="text-xs text-neutral-600 hidden lg:inline-flex items-center gap-1"
      title={`Currently viewing: ${label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      {viewers.length} viewing
    </span>
  );
}

function ExportMenu({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);

  function exportMarkdown() {
    const link = document.createElement("a");
    link.href = `/api/documents/${documentId}/export?format=md`;
    link.click();
    setOpen(false);
  }

  function exportPdf() {
    window.open(`/docs/${documentId}/print`, "_blank");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
      >
        Export ▾
      </button>
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 mt-1 w-40 bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-20"
        >
          <button onClick={exportMarkdown} className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100">
            Markdown (.md)
          </button>
          <button onClick={exportPdf} className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100">
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
