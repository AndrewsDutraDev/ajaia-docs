# Ajaia Docs

A lightweight, collaborative document editor inspired by Google Docs. Built as a product/engineering exercise for Ajaia: the goal wasn't to recreate Google Docs, but to deliver a document creation, editing, importing, and sharing flow that is **coherent, functional, and well-reasoned**, within a tight scope.

**Demo:** [ajaia-doc-app.vercel.app](https://ajaia-doc-app.vercel.app)
**Test accounts:** `ana@ajaia.com` and `bruno@ajaia.com` (no password — see Authentication section)

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Front + back | [Next.js 15](https://nextjs.org) (App Router, TypeScript) | A single full-stack project: React pages on the server/client and API routes side by side. Avoids CORS between two deploys and hosts for free on Vercel. |
| Rich-text editor | [Tiptap](https://tiptap.dev) (on top of ProseMirror) | A production-grade, extensible editor, instead of reinventing selection/contenteditable by hand. |
| Database | PostgreSQL ([Neon](https://neon.tech), free tier) | Serverless-friendly (plays well with Vercel's ephemeral functions), unlike file-based SQLite, which doesn't persist in serverless. |
| ORM | [Prisma](https://www.prisma.io) | Typed migrations/schema, type-safe client. |
| Validation | [Zod](https://zod.dev) | Input validation on API routes. |
| File import | [marked](https://github.com/markedjs/marked) | Markdown → HTML conversion to import `.md` as an editable document. |
| Testing | [Vitest](https://vitest.dev) | Fast unit tests, no browser required. |

---

## How the 5 areas of the challenge were addressed

### 1. Document creation and editing
- Create a blank document ("+ New document"), rename it (inline, from the dashboard or the top of the editor), edit content in the browser, save and reopen.
- Formatting: **bold**, _italic_, underline, H1/H2/H3 headings, paragraph, bullet and numbered lists — a fixed toolbar at the top of the editor.
- Autosave with debounce (1.2s after typing stops) + a status indicator ("Saving…" / "Saved" / "Error saving").

### 2. File upload
- Upload a `.txt` or `.md` file, converted into a **new editable document** (title derived from the filename, content converted to HTML).
- Unsupported types are rejected with a clear message, both in the API (`400` + message) and the UI (`accept=".txt,.md"` on the input).
- A 2MB limit on the source file, documented and validated on the backend.

### 3. Sharing
- Every document has an owner (`ownerId`).
- The owner can share with another user by email, choosing the role: **Can view** or **Can edit**.
- The dashboard clearly separates "My documents" from "Shared with me" (showing who shared it and the granted role).
- Documents opened in view mode show a "Read-only" badge and disable the toolbar/editing.
- Only the owner can share, revoke access, or delete the document — enforced both in the API (`403` if not the owner) and the UI.

### 4. Persistence
- Everything is persisted in Postgres (Neon) via Prisma: documents, users, and share records survive reloads and new deploys.
- The editor's HTML is saved as-is (Tiptap can reload the same HTML without losing formatting/structure).

### 5. Quality
- Input validation with Zod on every API route that accepts a body.
- Consistent error handling: JSON responses with `error` and the appropriate HTTP status (`400`, `401`, `403`, `404`).
- Access control centralized in a pure function (`src/lib/access.ts`) reused by every route — avoids duplicating permission logic.
- 14 automated tests (`npm test`) covering the file-import logic and the access-control logic (the two parts with non-trivial business rules).

---

## Authentication (simulated)

The challenge allows simulated authentication to keep the scope reasonable. Here, login is **by email, no password**: you type an email, the system creates the user if they don't exist yet, and sets a session cookie (`httpOnly`) with the user's `id`.

This is intentionally simple — there's no email-ownership verification and no password. In a real production app this would be replaced by a real auth provider (e.g. NextAuth + magic link, or OAuth). The point was to demonstrate the product flow (multiple users, sharing between them), not to build authentication.

Two shortcut accounts appear on the login screen (`ana@ajaia.com`, `bruno@ajaia.com`) to make it easy to test sharing between two identities without needing an incognito tab — but any email works.

---

## Architecture and decisions

### Priorities and reasons

With limited scope and time, the priority order was:

1. **A complete, solid core flow, over partial features.** Create → edit/format → import → share → persist works end to end, with real validation and access control. I preferred this over starting extra features (version history, real-time collaboration, attachments) and leaving them half-done — a half-built feature demonstrates nothing beyond running out of time.
2. **A single deploy, with no unnecessary moving parts.** Next.js serves the front end and API routes from the same project, on the same origin — no CORS, no two services to keep in sync, no extra infrastructure for a reviewer to run. The only external component is the database (Postgres/Neon), because that's unavoidable in serverless (see below) — not an architectural choice.
3. **Business rules centralized and testable, not scattered across routes.** Access control (`src/lib/access.ts`) and imported-file conversion (`src/lib/importFile.ts`) are pure, I/O-free functions called by every route that needs them. This prevents two routes from subtly disagreeing about "who can edit what," and it's what makes automated testing possible without spinning up a database or a browser.
4. **Simulated authentication on purpose, not as a lazy shortcut.** The challenge explicitly allows simulated login; spending time on a real auth provider (OAuth, email verification) wouldn't demonstrate more technical range than the rest of the app already does, and would take time away from the product flow that was the actual point of the exercise.
5. **Writes always go through the API; reads go straight from the server when possible.** The dashboard and editor fetch data via Prisma directly in the server component (faster, less code). Every mutation goes through an API route with validation (Zod) and a permission check — which also makes the API complete and independently testable outside the UI (see the `curl` examples below).

Left out on purpose, to protect this focus: per-document attachments, version history/undo, real-time simultaneous editing (multiplayer), fine-grained access control within a document, email notifications on share.

```
src/
  app/
    login/page.tsx           login screen (client)
    docs/page.tsx             dashboard (server component: fetches data)
    docs/[id]/page.tsx        editor (server component: fetches doc + resolves permission)
    api/
      auth/                   login, logout, me
      documents/               list/create documents
      documents/[id]/          read, update (title/content), delete
      documents/[id]/share/    list, invite, remove sharing
      documents/import/        upload .txt/.md → new document
  components/                 Editor (Tiptap), Dashboard, DocumentWorkspace, ShareDialog, UserMenu
  lib/
    prisma.ts                 client singleton
    session.ts                session cookie
    access.ts                 pure permission logic (OWNER/EDIT/VIEW) — tested
    importFile.ts             .txt/.md → HTML parsing — tested
```

**Why server components for reads and API routes for writes?** The dashboard and editor fetch data directly via Prisma on the server (no API round-trip), which is faster and simpler. Every mutation (create, edit, share, delete, import) goes through an API route with validation and a permission check — this also makes the API complete and independently testable (see the `curl` examples below).

**Why Postgres instead of SQLite/a local file?** Vercel runs serverless functions with no persistent disk between invocations — a local SQLite file wouldn't survive a redeploy or multiple instances. A managed Postgres (Neon) solves this and is still free.

**Permission model:** three levels — `OWNER` (owner, full control), `EDIT` (shared, can edit content/title, cannot share/delete), `VIEW` (shared, read-only). Resolved by a single, testable pure function (`resolveAccess`), avoiding scattered and diverging permission checks across routes.

---

## Running locally

### Prerequisites
- Node.js 20+
- A Postgres connection string (e.g. create a free project at [neon.tech](https://neon.tech))

### Steps

```bash
git clone <repo>
cd ajaia-docs
npm install
cp .env.example .env   # paste your Postgres DATABASE_URL
npx prisma db push     # creates the tables in the database
npx tsx prisma/seed.ts # (optional) creates example users and a sample document
npm run dev
```

Visit `http://localhost:3000`.

### Tests

```bash
npm test
```

### Production build

```bash
npm run build
npm start
```

---

## API examples (via curl)

```bash
# log in (creates the user if they don't exist, sets a session cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" -d '{"email":"you@example.com"}'

# import a .md file as a new document
curl -b cookies.txt -X POST http://localhost:3000/api/documents/import \
  -F "file=@my-file.md"

# share a document with edit permission
curl -b cookies.txt -X POST http://localhost:3000/api/documents/<id>/share \
  -H "Content-Type: application/json" -d '{"email":"someone@example.com","role":"EDIT"}'
```

---

## Deployment

The front end and back end live in the same Next.js project, hosted for free on **Vercel**. The database (Postgres) is hosted separately, for free, on **Neon**. The `DATABASE_URL` variable is configured in the project's Environment Variables on Vercel.
