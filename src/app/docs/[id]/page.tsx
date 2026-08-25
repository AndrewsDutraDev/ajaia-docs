import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { canView, resolveAccess } from "@/lib/access";
import DocumentWorkspace from "@/components/DocumentWorkspace";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) notFound();

  const [currentUser, document] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true, email: true } },
        shares: { select: { userId: true, role: true } },
      },
    }),
  ]);

  if (!currentUser || !document) notFound();

  const role = resolveAccess(document, userId);
  if (!canView(role)) notFound();

  return (
    <DocumentWorkspace
      documentId={document.id}
      initialTitle={document.title}
      initialContentHtml={document.contentHtml}
      role={role!}
      ownerLabel={role === "OWNER" ? null : document.owner.name}
      currentUser={currentUser}
    />
  );
}
