"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_PICKS = ["ana@ajaia.com", "bruno@ajaia.com"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(value: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not sign in.");
      router.push("/docs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Ajaia Docs</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Enter your email to sign in. No password required — this is a prototype with simulated authentication.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) login(email.trim());
          }}
          className="space-y-3"
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 text-white py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-xs text-neutral-500 mb-2">
            Example accounts to test sharing between users:
          </p>
          <div className="flex gap-2">
            {QUICK_PICKS.map((quickEmail) => (
              <button
                key={quickEmail}
                type="button"
                disabled={loading}
                onClick={() => login(quickEmail)}
                className="text-xs rounded-full border border-neutral-300 px-3 py-1 hover:bg-neutral-100 disabled:opacity-50"
              >
                {quickEmail}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
