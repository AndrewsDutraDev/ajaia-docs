export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export interface OwnedDocSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedDocSummary extends OwnedDocSummary {
  role: "VIEW" | "EDIT";
  owner: { name: string; email: string };
}

export interface ShareEntry {
  id: string;
  role: "VIEW" | "EDIT";
  user: { id: string; name: string; email: string };
}
