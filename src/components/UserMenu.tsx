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
    <div className="flex items-center gap-3 text-sm">
      <span className="text-neutral-600">
        <span className="font-medium text-neutral-900">{name}</span> · {email}
      </span>
      <button
        onClick={logout}
        disabled={loggingOut}
        className="text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
      >
        Sair
      </button>
    </div>
  );
}
