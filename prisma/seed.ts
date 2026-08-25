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

  const welcomeDoc = await prisma.document.upsert({
    where: { id: "seed-welcome-doc" },
    update: {},
    create: {
      id: "seed-welcome-doc",
      title: "Bem-vindo ao Ajaia Docs",
      ownerId: ana.id,
      contentHtml:
        "<h1>Bem-vindo ao Ajaia Docs</h1><p>Este é um documento de exemplo criado pela <strong>Ana</strong>. Edite este texto, formate com <em>itálico</em>, <u>sublinhado</u> e listas.</p><ul><li>Item um</li><li>Item dois</li></ul>",
    },
  });

  await prisma.share.upsert({
    where: { documentId_userId: { documentId: welcomeDoc.id, userId: bruno.id } },
    update: {},
    create: { documentId: welcomeDoc.id, userId: bruno.id, role: "EDIT" },
  });

  console.log("Seed concluído:", { ana: ana.email, bruno: bruno.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
