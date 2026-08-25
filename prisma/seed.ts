import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ana = await prisma.user.upsert({
    where: { email: "ana@ajaia.com" },
    update: {},
    create: { email: "ana@ajaia.com", name: "Ana" },
  });

  const bruno = await prisma.user.upsert({
    where: { email: "bruno@ajaia.com" },
    update: {},
    create: { email: "bruno@ajaia.com", name: "Bruno" },
  });

  const welcomeDocData = {
    title: "Welcome to Ajaia Docs",
    contentHtml:
      "<h1>Welcome to Ajaia Docs</h1><p>This is a sample document created by <strong>Ana</strong>. Edit this text, format it with <em>italics</em>, <u>underline</u>, and lists.</p><ul><li>Item one</li><li>Item two</li></ul>",
  };

  const welcomeDoc = await prisma.document.upsert({
    where: { id: "seed-welcome-doc" },
    update: welcomeDocData,
    create: { id: "seed-welcome-doc", ownerId: ana.id, ...welcomeDocData },
  });

  await prisma.share.upsert({
    where: { documentId_userId: { documentId: welcomeDoc.id, userId: bruno.id } },
    update: {},
    create: { documentId: welcomeDoc.id, userId: bruno.id, role: "EDIT" },
  });

  console.log("Seed complete:", { ana: ana.email, bruno: bruno.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
