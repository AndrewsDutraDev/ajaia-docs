import { describe, expect, it } from "vitest";
import { canEdit, canManageSharing, canView, resolveAccess } from "../src/lib/access";

const doc = {
  ownerId: "user-owner",
  shares: [
    { userId: "user-editor", role: "EDIT" as const },
    { userId: "user-viewer", role: "VIEW" as const },
  ],
};

describe("resolveAccess", () => {
  it("grants OWNER to the document's owner", () => {
    expect(resolveAccess(doc, "user-owner")).toBe("OWNER");
  });

  it("grants the shared role to a user with a Share row", () => {
    expect(resolveAccess(doc, "user-editor")).toBe("EDIT");
    expect(resolveAccess(doc, "user-viewer")).toBe("VIEW");
  });

  it("returns null for a user with no relationship to the document", () => {
    expect(resolveAccess(doc, "user-stranger")).toBeNull();
  });

  it("returns null when there is no logged-in user", () => {
    expect(resolveAccess(doc, null)).toBeNull();
  });
});

describe("permission gates", () => {
  it("canView is true for OWNER, EDIT and VIEW", () => {
    expect(canView("OWNER")).toBe(true);
    expect(canView("EDIT")).toBe(true);
    expect(canView("VIEW")).toBe(true);
    expect(canView(null)).toBe(false);
  });

  it("canEdit is true for OWNER and EDIT only", () => {
    expect(canEdit("OWNER")).toBe(true);
    expect(canEdit("EDIT")).toBe(true);
    expect(canEdit("VIEW")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });

  it("canManageSharing is true only for OWNER", () => {
    expect(canManageSharing("OWNER")).toBe(true);
    expect(canManageSharing("EDIT")).toBe(false);
    expect(canManageSharing("VIEW")).toBe(false);
  });
});
