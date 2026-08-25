export type AccessRole = "OWNER" | "EDIT" | "VIEW" | null;

interface AccessInput {
  ownerId: string;
  shares: { userId: string; role: "VIEW" | "EDIT" }[];
}

/** Pure function: given a document's owner + share list, what access does `userId` have? */
export function resolveAccess(doc: AccessInput, userId: string | null): AccessRole {
  if (!userId) return null;
  if (doc.ownerId === userId) return "OWNER";
  const share = doc.shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

export function canView(role: AccessRole): boolean {
  return role === "OWNER" || role === "EDIT" || role === "VIEW";
}

export function canEdit(role: AccessRole): boolean {
  return role === "OWNER" || role === "EDIT";
}

export function canManageSharing(role: AccessRole): boolean {
  return role === "OWNER";
}
