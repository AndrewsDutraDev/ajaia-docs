import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { canView, resolveAccess } from "@/lib/access";
import PrintTrigger from "@/components/PrintTrigger";

export default async function DocumentPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) notFound();

  const document = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
  if (!document) notFound();

  const role = resolveAccess(document, userId);
  if (!canView(role)) notFound();

  // Avoid a duplicate heading when the content already opens with an H1 matching the title (e.g. imported files).
  const escapedTitle = document.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alreadyHasTitleHeading = new RegExp(`^\\s*<h1[^>]*>\\s*${escapedTitle}\\s*</h1>`, "i").test(document.contentHtml);

  return (
    <div className="doc-print max-w-3xl mx-auto px-8 py-10">
      <style>{`
        .doc-print h1 { font-size: 1.9rem; font-weight: 700; margin: 0 0 1.5rem; }
        .doc-print h2 { font-size: 1.5rem; font-weight: 700; margin: 1.2rem 0 0.5rem; }
        .doc-print h3 { font-size: 1.2rem; font-weight: 600; margin: 1rem 0 0.4rem; }
        .doc-print p { margin: 0.6rem 0; line-height: 1.6; }
        .doc-print ul, .doc-print ol { margin: 0.6rem 0; padding-left: 1.5rem; }
        .doc-print ul { list-style: disc; }
        .doc-print ol { list-style: decimal; }
        .doc-print strong { font-weight: 700; }
        .doc-print em { font-style: italic; }
        .doc-print u { text-decoration: underline; }
        @media print {
          .doc-print { padding: 0; max-width: none; }
        }
      `}</style>
      {!alreadyHasTitleHeading && <h1>{document.title}</h1>}
      <div dangerouslySetInnerHTML={{ __html: document.contentHtml }} />
      <PrintTrigger />
    </div>
  );
}
