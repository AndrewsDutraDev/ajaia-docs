"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="w-6 h-6 rounded-full bg-accent-tint text-accent-dark font-serif font-semibold text-xs flex items-center justify-center shrink-0">
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="text-ink-soft hidden sm:inline">
        <span className="font-medium text-ink">{name}</span> · {email}
      </span>
      <button
        onClick={logout}
        disabled={loggingOut}
        className="text-ink-soft hover:text-ink transition-colors duration-150 disabled:opacity-50"
      >
        Log out
      </button>
    </div>
  );
}
