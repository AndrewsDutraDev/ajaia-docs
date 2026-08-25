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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-soft p-8">
        <h1 className="font-serif text-2xl font-semibold mb-1.5 text-ink">Ajaia Docs</h1>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
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
            className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors duration-150"
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent text-white py-2.5 text-sm font-medium transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-xs text-ink-soft mb-2">
            Example accounts to test sharing between users:
          </p>
          <div className="flex gap-2">
            {QUICK_PICKS.map((quickEmail) => (
              <button
                key={quickEmail}
                type="button"
                disabled={loading}
                onClick={() => login(quickEmail)}
                className="text-xs rounded-full bg-paper border border-line px-3 py-1 text-ink-soft transition-colors duration-150 hover:bg-accent-tint hover:text-accent-dark hover:border-accent/30 disabled:opacity-50"
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
