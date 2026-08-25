import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import Dashboard from "@/components/Dashboard";

export default async function DocsPage() {
  const userId = await getSessionUserId();
  if (!userId) notFound();

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) notFound();

  const [owned, sharedWithMe] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    }),
    prisma.share.findMany({
      where: { userId },
      orderBy: { document: { updatedAt: "desc" } },
      select: {
        role: true,
        document: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  return (
    <Dashboard
      currentUser={currentUser}
      initialOwned={owned.map((d) => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() }))}
      initialShared={sharedWithMe.map((s) => ({
        id: s.document.id,
        title: s.document.title,
        createdAt: s.document.createdAt.toISOString(),
        updatedAt: s.document.updatedAt.toISOString(),
        role: s.role,
        owner: s.document.owner,
      }))}
    />
  );
}
