# Ajaia Docs

Editor de documentos colaborativo e leve, inspirado no Google Docs. Construído como exercício de produto/engenharia para a Ajaia: o objetivo não foi recriar o Google Docs, e sim entregar um fluxo de criação, edição, importação e compartilhamento de documentos que seja **coerente, funcional e bem fundamentado**, dentro de um escopo enxuto.

**Demo:** [ajaia-doc-app.vercel.app](https://ajaia-doc-app.vercel.app)
**Contas de teste:** `ana@ajaia.com` e `bruno@ajaia.com` (sem senha — ver seção Autenticação)

---

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Front + Back | [Next.js 15](https://nextjs.org) (App Router, TypeScript) | Um único projeto full-stack: páginas React no servidor/cliente e API routes lado a lado. Evita CORS entre dois deploys e hospeda 100% grátis na Vercel. |
| Editor rich-text | [Tiptap](https://tiptap.dev) (sobre ProseMirror) | Editor de produção, extensível, sem reinventar seleção/contenteditable na mão. |
| Banco de dados | PostgreSQL ([Neon](https://neon.tech), free tier) | Serverless-friendly (funciona bem com funções efêmeras da Vercel), ao contrário de SQLite em disco, que não persiste em serverless. |
| ORM | [Prisma](https://www.prisma.io) | Migrations/schema tipados, client type-safe. |
| Validação | [Zod](https://zod.dev) | Validação de entrada nas rotas de API. |
| Import de arquivo | [marked](https://github.com/markedjs/marked) | Conversão Markdown → HTML para importar `.md` como documento editável. |
| Testes | [Vitest](https://vitest.dev) | Testes unitários rápidos, sem necessidade de browser. |

---

## Como as 5 áreas do desafio foram resolvidas

### 1. Criação e edição de documentos
- Criar documento em branco ("+ Novo documento"), renomear (inline, no dashboard ou no topo do editor), editar conteúdo no navegador, salvar e reabrir.
- Formatação: **negrito**, _itálico_, sublinhado, títulos H1/H2/H3, parágrafo, listas com marcadores e numeradas — toolbar fixa no topo do editor.
- Autosave com debounce (1,2s após parar de digitar) + indicador de status ("Salvando…" / "Salvo" / "Erro ao salvar").

### 2. Envio de arquivo
- Upload de `.txt` ou `.md`, convertido em um **novo documento editável** (título derivado do nome do arquivo, conteúdo convertido para HTML).
- Tipos não suportados são rejeitados com mensagem clara, tanto na API (`400` + mensagem) quanto na UI (`accept=".txt,.md"` no input).
- Limite de 2MB para o arquivo de origem, documentado e validado no backend.

### 3. Compartilhamento
- Cada documento tem um dono (`ownerId`).
- O dono pode compartilhar com outro usuário por e-mail, escolhendo o papel: **Pode visualizar** ou **Pode editar**.
- Dashboard separa claramente "Meus documentos" de "Compartilhados comigo" (com o nome de quem compartilhou e o papel concedido).
- Documentos abertos em modo visualização mostram um badge "Somente leitura" e desabilitam a toolbar/edição.
- Apenas o dono pode compartilhar, remover acesso ou excluir o documento — reforçado tanto na API (`403` se não for dono) quanto na UI.

### 4. Persistência
- Tudo é persistido em Postgres (Neon) via Prisma: documentos, usuários e registros de compartilhamento sobrevivem a reload e a novos deploys.
- HTML do editor é salvo como está (Tiptap consegue recarregar o mesmo HTML sem perda de formatação/estrutura).

### 5. Qualidade
- Validação de entrada com Zod em todas as rotas de API que recebem body.
- Tratamento de erros consistente: respostas JSON com `error` e status HTTP apropriado (`400`, `401`, `403`, `404`).
- Controle de acesso centralizado em uma função pura (`src/lib/access.ts`) reaproveitada por todas as rotas — evita duplicar lógica de permissão.
- 14 testes automatizados (`npm test`) cobrindo a lógica de importação de arquivo e de controle de acesso (as duas partes com regras de negócio não triviais).

---

## Autenticação (simulada)

O desafio permite autenticação simulada para manter o escopo razoável. Aqui, o login é **por e-mail, sem senha**: você digita um e-mail, o sistema cria o usuário se ele não existir e define um cookie de sessão (`httpOnly`) com o `id` do usuário.

Isso é intencionalmente simples — não há verificação de posse do e-mail, nem senha. Em produção real isso seria substituído por um provedor de auth de verdade (ex: NextAuth + magic link, ou OAuth). O ponto era demonstrar o fluxo de produto (múltiplos usuários, compartilhamento entre eles), não construir autenticação.

Duas contas de atalho aparecem na tela de login (`ana@ajaia.com`, `bruno@ajaia.com`) para facilitar testar o compartilhamento entre duas identidades sem precisar de aba anônima — mas qualquer e-mail funciona.

---

## Arquitetura e decisões

### Prioridades e motivos

Com escopo e prazo limitados, a ordem de prioridade foi:

1. **Fluxo principal completo e sólido, em vez de recursos parciais.** Criar → editar/formatar → importar → compartilhar → persistir funciona de ponta a ponta, com validação e controle de acesso reais. Preferi isso a começar recursos extras (histórico de versões, tempo real, anexos) e deixá-los pela metade — meio recurso não demonstra nada além de que ficou sem tempo.
2. **Um único deploy, sem partes móveis desnecessárias.** Next.js serve front e API routes do mesmo projeto, na mesma origem — sem CORS, sem dois serviços para sincronizar, sem infra extra para o revisor rodar. O único componente externo é o banco (Postgres/Neon), porque isso é inevitável em serverless (ver abaixo) — não por escolha de arquitetura.
3. **Regras de negócio centralizadas e testáveis, não espalhadas pelas rotas.** Controle de acesso (`src/lib/access.ts`) e conversão de arquivo importado (`src/lib/importFile.ts`) são funções puras, sem I/O, chamadas por todas as rotas que precisam delas. Isso evita duas rotas divergirem sutilmente sobre "quem pode editar o quê" e é o que torna os testes automatizados possíveis sem subir banco ou browser.
4. **Autenticação simulada de propósito, não por atalho preguiçoso.** O desafio permite login simulado explicitamente; investir tempo em um provedor de auth real (OAuth, verificação de e-mail) não demonstraria mais domínio técnico do que já é demonstrado no resto do app, e tiraria tempo do fluxo de produto que era o ponto central do exercício.
5. **Escrita sempre via API, leitura direta no servidor quando dá.** Dashboard e editor buscam dados via Prisma direto no server component (mais rápido, menos código). Toda mutação passa por uma API route com validação (Zod) e checagem de permissão — o que também deixa a API completa e testável isoladamente por fora da UI (veja os exemplos de `curl` mais abaixo).

O que ficou de fora, de propósito, para manter esse foco: anexos por documento, histórico de versões/desfazer, edição simultânea em tempo real (multiplayer), controle de acesso granular por trecho do documento, notificação por e-mail ao compartilhar.

```
src/
  app/
    login/page.tsx           tela de login (client)
    docs/page.tsx             dashboard (server component: busca dados)
    docs/[id]/page.tsx        editor (server component: busca doc + resolve permissão)
    api/
      auth/                   login, logout, me
      documents/               listar/criar documentos
      documents/[id]/          ler, atualizar (título/conteúdo), excluir
      documents/[id]/share/    listar, convidar, remover compartilhamento
      documents/import/        upload de .txt/.md → novo documento
  components/                 Editor (Tiptap), Dashboard, DocumentWorkspace, ShareDialog, UserMenu
  lib/
    prisma.ts                 client singleton
    session.ts                cookie de sessão
    access.ts                 lógica pura de permissão (OWNER/EDIT/VIEW) — testada
    importFile.ts             parsing .txt/.md → HTML — testado
```

**Por que server components para leitura e API routes para escrita?** Dashboard e editor buscam dados diretamente via Prisma no servidor (sem round-trip de API), o que é mais rápido e simples. Todas as mutações (criar, editar, compartilhar, excluir, importar) passam por API routes com validação e checagem de permissão — isso também deixa a API completa e testável isoladamente (veja exemplos de `curl` abaixo).

**Por que Postgres em vez de SQLite/arquivo local?** A Vercel roda funções serverless sem disco persistente entre invocações — SQLite em arquivo local não sobreviveria a um redeploy ou a múltiplas instâncias. Postgres gerenciado (Neon) resolve isso e ainda é gratuito.

**Modelo de permissão:** três níveis — `OWNER` (dono, controle total), `EDIT` (compartilhado, pode editar conteúdo/título, não pode compartilhar/excluir), `VIEW` (compartilhado, somente leitura). Resolvido por uma única função pura testável (`resolveAccess`), evitando checagens de permissão espalhadas e divergentes pelas rotas.

---

## Rodando localmente

### Pré-requisitos
- Node.js 20+
- Uma connection string do Postgres (ex: crie um projeto grátis em [neon.tech](https://neon.tech))

### Passos

```bash
git clone <repo>
cd ajaia-docs
npm install
cp .env.example .env   # cole sua DATABASE_URL do Postgres
npx prisma db push     # cria as tabelas no banco
npx tsx prisma/seed.ts # (opcional) cria usuários e documento de exemplo
npm run dev
```

Acesse `http://localhost:3000`.

### Testes

```bash
npm test
```

### Build de produção

```bash
npm run build
npm start
```

---

## Exemplos de API (via curl)

```bash
# login (cria usuário se não existir, seta cookie de sessão)
curl -c cookies.txt -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" -d '{"email":"voce@exemplo.com"}'

# importar um arquivo .md como novo documento
curl -b cookies.txt -X POST http://localhost:3000/api/documents/import \
  -F "file=@meu-arquivo.md"

# compartilhar um documento com permissão de edição
curl -b cookies.txt -X POST http://localhost:3000/api/documents/<id>/share \
  -H "Content-Type: application/json" -d '{"email":"outra@pessoa.com","role":"EDIT"}'
```

---

## Deploy

Front e back vivem no mesmo projeto Next.js, hospedado gratuitamente na **Vercel**. O banco (Postgres) é hospedado separadamente, gratuitamente, no **Neon**. A variável `DATABASE_URL` é configurada nas Environment Variables do projeto na Vercel.
