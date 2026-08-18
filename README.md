# PátioGestor

Plataforma completa para gestão de pátios comerciais, street malls, galerias
e centros comerciais — empreendimentos, unidades locáveis, locatários, CRM
comercial, propostas, contratos, financeiro, manutenção, documentos, planta
interativa e portal do locatário.

> O nome "PátioGestor" é apenas provisório e está centralizado em
> [`src/config/app.ts`](src/config/app.ts) — para renomear o sistema, altere
> somente esse arquivo.

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Modelo de dados](#modelo-de-dados)
- [Pré-requisitos](#pré-requisitos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Instalação e execução local](#instalação-e-execução-local)
- [Configuração do Supabase (produção)](#configuração-do-supabase-produção)
- [Testes](#testes)
- [Build de produção](#build-de-produção)
- [Deploy na Vercel](#deploy-na-vercel)
- [Credenciais de demonstração](#credenciais-de-demonstração)
- [Segurança, LGPD e auditoria](#segurança-lgpd-e-auditoria)
- [Limitações conhecidas](#limitações-conhecidas)
- [Próximas evoluções](#próximas-evoluções)

## Visão geral

O PátioGestor permite que uma empresa administradora gerencie múltiplos
empreendimentos comerciais (street malls, pátios, galerias), cada um com
seus setores, unidades locáveis (salas, lojas, quiosques, boxes, vagas,
depósitos), locatários, propostas comerciais, contratos, cobranças,
manutenção e documentos — com controle de acesso por perfil, isolamento de
dados por empresa/empreendimento e um portal dedicado para o locatário.

Este repositório contém uma aplicação **funcional e conectada a um banco de
dados real** — não um protótipo estático. Todas as telas listadas nos
critérios do projeto renderizam dados vindos do PostgreSQL via Prisma, e as
ações (cadastrar, editar, mudar status, gerar cobrança, dar baixa, etc.)
persistem no banco através de Server Actions do Next.js, com validação e
checagem de permissão no servidor — nunca apenas no cliente.

## Funcionalidades

| Módulo | Status | Observações |
|---|---|---|
| Autenticação, RBAC, proteção de rotas | ✅ | 7 perfis, middleware, permissões validadas no servidor |
| Empresas / Empreendimentos / Setores | ✅ | CRUD completo, abas, indicadores |
| Unidades + histórico de status | ✅ | CRUD completo, mudança de status com motivo obrigatório e histórico |
| Planta interativa | ✅ (v1) | Upload de imagem, áreas retangulares posicionadas, cores por status, zoom, legenda |
| Locatários (visão 360°) | ✅ | CRUD, contatos múltiplos, contratos/propostas/cobranças/chamados relacionados |
| CRM / funil comercial | ✅ | Kanban por etapas, leads, responsável, origem |
| Propostas comerciais | ✅ | CRUD, fluxo de status, PDF, conversão em contrato |
| Contratos | ✅ | CRUD, **bloqueio de conflito de ocupação**, aditivos, fluxo de status que reflete na unidade |
| Financeiro | ✅ | Geração de cobranças mensais, baixa total/parcial, cancelamento, estorno, recibo em PDF |
| Régua de inadimplência | ✅ | Faixas de atraso configuráveis |
| Reajustes / índices econômicos | ✅ (registro manual) | Tabela para registro manual — nunca inventa índices |
| Manutenção (Kanban) | ✅ | Chamados, categorias, prioridade, tempo médio de atendimento |
| Documentos | ✅ | Upload, tipos, tags, controle de vencimento |
| Proprietários | ✅ | Módulo opcional (ativável por empresa) |
| Dashboard executivo | ✅ | Indicadores e 6 gráficos calculados a partir de dados reais |
| Relatórios / exportação CSV | ✅ | Ocupação, contratos, inadimplência, financeiro |
| Notificações internas | ✅ | Geradas por regras de negócio (vencimentos, atrasos) |
| Auditoria | ✅ | Somente leitura, ações críticas |
| Portal do locatário | ✅ | Isolado por `tenantId`, dashboard, contrato, cobranças, documentos, chamados, dados |
| Usuários e permissões | ✅ | Convite (via Resend se configurado, senão link exibido em tela), papéis, escopo por empresa/empreendimento |
| Vistorias/checklists | ✅ | Entrada, saída, periódica, segurança etc.; checklist por item (conforme/não conforme/não se aplica), foto por item, laudo em PDF |
| Comparação de unidades lado a lado | ✅ | Seleção múltipla (até 4) na listagem; área, valor, valor/m², localização e infraestrutura lado a lado |
| Envio real de e-mail (convite/senha) | ⚠️ Integração pronta, não validada | Ativa via `RESEND_API_KEY`; nunca testada contra a API real — ver "Limitações conhecidas" |
| WhatsApp/SMS/push | ⚠️ Não implementado | Fora do escopo desta versão |

## Tecnologias

- **Next.js 15** (App Router) + **React 18** + **TypeScript** (modo estrito)
- **Tailwind CSS** + componentes no padrão shadcn/ui (Radix UI primitives)
- **PostgreSQL** + **Prisma ORM** (migrations versionadas)
- **NextAuth.js (Auth.js) v5** — autenticação por credenciais (e-mail/senha)
- **React Hook Form** + **Zod** — formulários e validação (cliente e servidor)
- **Recharts** — gráficos do dashboard
- **TanStack Table** (dependência instalada; tabelas atuais usam componentes
  próprios com paginação/filtro no servidor via query params)
- **date-fns** com localização `pt-BR`
- **@react-pdf/renderer** — geração de PDFs (propostas, recibos)
- **Vitest** — testes unitários e de integração
- **Playwright** — testes de fluxo ponta a ponta (login, navegação)

### Por que não Supabase Auth/Storage nesta versão?

O prompt original pede Supabase para banco, autenticação e storage. Este
ambiente de desenvolvimento não tem acesso a um projeto Supabase provisionado
(nem à rede necessária para criar um), então a decisão tomada foi:

- **Banco de dados**: PostgreSQL puro via Prisma — **100% compatível** com
  Supabase, que também é PostgreSQL. Basta apontar `DATABASE_URL` para o
  Postgres do seu projeto Supabase (veja
  [Configuração do Supabase](#configuração-do-supabase-produção)).
- **Autenticação**: NextAuth.js com provider de credenciais (e-mail/senha
  com hash bcrypt), sessão JWT. Migrar para Supabase Auth é possível
  futuramente, mas exigiria reescrever o fluxo de login/registro — não foi
  feito para manter o escopo entregável dentro do tempo disponível.
- **Armazenamento de arquivos**: `src/lib/storage.ts` implementa as duas
  formas de armazenamento e escolhe automaticamente qual usar, sem exigir
  mudança de código — apenas de variáveis de ambiente. Sem
  `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` configurados
  (situação padrão deste ambiente de demonstração, que não tem credenciais
  de um provedor real), os uploads (plantas, documentos, fotos) são salvos
  em `public/uploads/` no próprio servidor via `/api/upload` — **adequado
  para rodar localmente, mas não para produção** (disco efêmero em
  plataformas serverless como a Vercel). Assim que essas variáveis são
  definidas, `storeFile()` passa a enviar para um bucket privado do
  Supabase Storage e devolver URLs assinadas temporárias, sem qualquer
  alteração nas telas ou nas Server Actions que chamam essa função — a
  integração nunca foi testada contra um projeto Supabase real (nenhuma
  credencial foi fornecida durante o desenvolvimento), então valide o fluxo
  de upload/download em homologação antes de confiar nela em produção.
- **E-mail transacional**: `src/lib/email.ts` segue o mesmo padrão —
  convites de usuário e recuperação de senha são enviados via Resend quando
  `RESEND_API_KEY` está definido; sem a chave, o link é exibido diretamente
  em tela para o administrador (nunca "enviado" silenciosamente). Assim como
  o Storage, essa integração está pronta no código mas não foi validada
  contra a API real do Resend por falta de credenciais.

## Arquitetura

- **App Router** do Next.js com Server Components por padrão; interatividade
  isolada em Client Components (`"use client"`) apenas onde necessário
  (formulários, diálogos, gráficos, kanban).
- **Server Actions** (`src/server/actions/*.ts`) concentram toda a lógica de
  escrita: validam a sessão (`requireSession`), checam permissão
  (`requirePermission`), validam o payload com Zod, aplicam a regra de
  negócio, gravam auditoria (`recordAudit`) e revalidam as rotas afetadas.
  **Nenhuma regra crítica depende apenas do frontend.**
- **Middleware** (`src/middleware.ts`) protege todas as rotas exceto login,
  recuperação de senha e páginas de erro; separa o portal do locatário do
  restante do sistema. Roda em Edge Runtime lendo o JWT diretamente (não
  importa a configuração completa do NextAuth, que depende de bcrypt/Prisma
  — APIs Node.js incompatíveis com Edge).
- **Isolamento por empresa/empreendimento**: `src/lib/session.ts` calcula o
  escopo (`companyScope`/`propertyScope`) a partir da sessão para uso em
  consultas (filtros `WHERE`), e expõe também os guardas
  `assertCompanyAccess(session, companyId)` /
  `assertPropertyAccess(session, propertyId)`, que lançam erro quando o
  usuário autenticado tenta ler ou escrever um registro de uma empresa/
  empreendimento fora do seu escopo (relevante sobretudo em escrita: uma
  consulta com filtro pode simplesmente devolver menos linhas, mas um
  `update`/`create` recebendo um ID de outra empresa via payload precisa de
  uma checagem explícita, não apenas de um filtro). Todas as Server Actions
  que criam ou alteram dados de empresa/empreendimento
  (`src/server/actions/*.ts` — empreendimentos, setores, unidades,
  locatários, propostas, contratos, cobranças/pagamentos, documentos,
  chamados de manutenção, proprietários, usuários) chamam esses guardas antes
  de tocar no banco, cobrindo tanto o ID recebido diretamente no payload
  quanto IDs relacionados resolvidos a partir dele (ex.: criar uma cobrança
  a partir do `contractId` recebido valida a empresa do contrato/
  empreendimento associado, não apenas um campo solto de `companyId`). Essa
  cobertura é validada por testes de integração dedicados em
  `tests/integration/company-isolation.test.ts`, que tentam — e devem falhar
  ao tentar — ler/escrever dados de outra empresa em empreendimentos,
  financeiro, manutenção, documentos e propostas.
- **Auditoria**: `src/lib/audit.ts` grava um registro em `audit_logs` a cada
  ação crítica (criação, alteração, exclusão lógica, mudança de status,
  aprovação, cancelamento, baixa financeira, estorno, reajuste, download de
  documento, alteração de permissões).

## Estrutura de pastas

```
prisma/
  schema.prisma          # Modelo de dados completo
  migrations/             # Migrations versionadas
  seed.ts                 # Dados de demonstração
src/
  app/
    (app)/                 # Área interna (empreendimentos, unidades, financeiro, ...)
    portal/                # Portal do locatário (isolado)
    login/, esqueci-senha/, redefinir-senha/[token]/
    api/                   # Rotas de API (upload, CEP, PDFs, CSVs, NextAuth)
    403/, not-found.tsx, error.tsx
  components/
    ui/                    # Componentes de interface reutilizáveis (padrão shadcn/ui)
    layout/                # Sidebar, header, breadcrumbs, nav
    upload/                 # Componente de upload de arquivo
  server/actions/          # Server Actions (regra de negócio + validação + auditoria)
  lib/                     # Prisma client, auth, permissões, formatação, PDF, métricas
  config/app.ts            # Configuração central (nome do sistema, moeda, fuso, alertas)
tests/
  unit/                    # Testes unitários (máscaras, permissões)
  integration/             # Testes de integração com banco real (Vitest)
  e2e/                     # Testes de fluxo com Playwright
supabase/
  policies.sql             # Políticas RLS de referência para migração futura ao Supabase
docs/
  database-schema.md       # Diagrama ER (Mermaid)
  backup-restore.md
  admin-quickstart.md
```

## Modelo de dados

Ver [`docs/database-schema.md`](docs/database-schema.md) para o diagrama
entidade-relacionamento completo (Mermaid) e as decisões de modelagem
(UUIDs, exclusão lógica, `Decimal` para valores monetários, histórico
imutável). O schema Prisma fonte da verdade está em
[`prisma/schema.prisma`](prisma/schema.prisma).

## Pré-requisitos

- **Node.js 20+**
- **PostgreSQL 14+** (local, Docker, ou um projeto Supabase)
- npm (o projeto foi desenvolvido e testado com npm; outros gerenciadores
  devem funcionar, mas não foram testados)

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do PostgreSQL |
| `NEXTAUTH_SECRET` | Sim | Segredo para assinar/criptografar sessões — gere com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Sim | URL base da aplicação (ex.: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Sim | Mesma URL, exposta ao cliente (usada em links de convite/recuperação) |
| `SMTP_HOST` / `RESEND_API_KEY` | Não | Se ausentes, links de convite e recuperação de senha são exibidos em tela em vez de enviados por e-mail (ver [Limitações](#limitações-conhecidas)) |

## Instalação e execução local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite .env com sua connection string do Postgres e um NEXTAUTH_SECRET

# 3. Criar o banco de dados (se ainda não existir)
createdb patiogestor   # ou crie via seu cliente Postgres/Supabase preferido

# 4. Executar as migrations
npx prisma migrate deploy
# (em desenvolvimento, "npx prisma migrate dev" também funciona e mantém o
# histórico de migrations sincronizado caso você altere o schema)

# 5. Popular o banco com dados de demonstração
npm run db:seed

# 6. Rodar em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

### Comandos disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build         # Build de produção
npm run start          # Servidor de produção (após build)
npm run lint            # ESLint
npm run typecheck       # Checagem de tipos (tsc --noEmit)
npm run test             # Testes unitários e de integração (Vitest)
npm run test:e2e          # Testes de fluxo (Playwright)
npm run db:migrate         # Prisma migrate dev
npm run db:seed             # Popular dados de demonstração
npm run db:studio            # Prisma Studio (explorar o banco visualmente)
```

## Configuração do Supabase (produção)

O PostgreSQL do Supabase é 100% compatível com este projeto — não é
necessário usar o SDK do Supabase para o banco, basta a connection string:

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → Database → Connection string**, copie a URI no
   modo **Session pooling** (porta 6543) para uso geral da aplicação, ou a
   conexão direta (porta 5432) para rodar as migrations.
3. Defina `DATABASE_URL` no seu ambiente de produção (ex.: variáveis de
   ambiente da Vercel) com essa connection string.
4. Rode as migrations apontando para o Supabase:
   ```bash
   DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres" \
     npx prisma migrate deploy
   ```
5. (Opcional, recomendado antes de ir para produção real) Rode o seed em um
   ambiente de homologação para validar, mas **não rode o seed de
   demonstração em produção** com dados reais de clientes.

### Row Level Security (RLS)

Como a aplicação usa uma única credencial de serviço do Prisma (não o
Supabase Auth), o RLS do Postgres não está ativo — o isolamento de dados é
garantido na camada de aplicação (ver `src/lib/session.ts` e a validação em
cada server action). [`supabase/policies.sql`](supabase/policies.sql)
documenta as políticas RLS recomendadas caso o projeto migre para Supabase
Auth no futuro — **leia os comentários do arquivo antes de aplicá-las**, pois
dependem dessa migração de autenticação ainda não realizada.

### Storage

Ver a seção [Tecnologias](#por-que-não-supabase-authstorage-nesta-versão)
sobre a limitação atual de upload local — a migração para Supabase Storage
troca apenas o endpoint `/api/upload`, sem alterar o restante do sistema.

## Testes

### Testes unitários e de integração (Vitest)

Os testes de integração rodam contra um **banco PostgreSQL de teste real**
(não mocks de banco), truncando as tabelas entre os casos.

```bash
# 1. Crie o banco de teste
createdb patiogestor_test

# 2. Configure tests/.env.test (já incluso no repositório, ajuste se necessário)
#    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/patiogestor_test"

# 3. Aplique as migrations no banco de teste
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/patiogestor_test" \
  npx prisma migrate deploy

# 4. Rode os testes
npm run test
```

Cobertura atual (27 casos):

- Validação de CPF/CNPJ e máscaras.
- Permissões por perfil (o que cada papel pode/não pode fazer).
- **Prevenção de conflito de ocupação em contratos** (regra de negócio
  central do módulo de contratos).
- Geração de cobranças mensais, **baixa total e parcial**, rejeição de
  pagamento acima do saldo, bloqueio de cancelamento com pagamento
  existente.
- **Cálculo da taxa de ocupação** (por unidades e por área, considerando
  carência como ocupação).
- **Isolamento de dados por empresa** (um admin não cria/edita dados de
  outra empresa; consultas filtradas não vazam dados entre empresas).
- Cadastro de locatário com rejeição de documento duplicado.
- Conversão de proposta aprovada em contrato.
- Lógica de autenticação (usuário ativo/inativo, senha correta/incorreta) e
  isolamento do portal do locatário (só enxerga o próprio contrato).

### Testes de fluxo (Playwright)

```bash
npm run test:e2e
```

Sobem um build de produção real (`npm run build && npm run start`) na porta
3100 e testam com um navegador headless:

- Login com credenciais válidas e inválidas.
- Redirecionamento de locatário para o portal e bloqueio de acesso a telas
  internas.
- Redirecionamento para `/login` sem sessão.
- Renderização sem erros de todas as telas administrativas principais
  (empreendimentos, unidades, locatários, CRM, propostas, contratos,
  financeiro, inadimplência, manutenção, documentos, relatórios,
  notificações, usuários, auditoria, proprietários, configurações,
  empresas).
- Navegação empreendimento → planta interativa → unidade.

Esses testes de navegação foram o que revelou e permitiu corrigir, ainda
durante o desenvolvimento, um bug real de serialização entre Server e Client
Components (ícones passados como prop para componentes cliente) que teria
quebrado a aplicação em produção — por isso valem a pena além dos testes
unitários.

## Build de produção

```bash
npm run build
npm run start
```

O build gera 40 rotas (Server Components dinâmicos + algumas estáticas) sem
erros de compilação ou de tipos. Há dois avisos benignos e conhecidos do
`next build`, relacionados a `CompressionStream`/`DecompressionStream`
usados pela biblioteca `jose` (dependência do NextAuth) no Edge Runtime do
middleware — são falsos positivos da análise estática do webpack; essas APIs
são suportadas nos ambientes Edge reais (ex.: Vercel Edge Runtime) e não
impedem o funcionamento da aplicação.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente do projeto (mesmas do `.env`, com
   `DATABASE_URL` apontando para o Postgres de produção — ex.: Supabase).
3. Rode as migrations contra o banco de produção **antes** do primeiro
   deploy (ou como parte do pipeline de CI/CD):
   ```bash
   npx prisma migrate deploy
   ```
4. Deploy — a Vercel detecta o Next.js automaticamente (`next build`).
5. **Importante**: como o upload de arquivos hoje grava em disco local
   (`public/uploads/`), ele **não funciona de forma persistente na Vercel**
   (sistema de arquivos efêmero/somente leitura em produção serverless).
   Para produção real, troque `/api/upload` por upload direto ao Supabase
   Storage antes do deploy — a estrutura de dados já suporta essa troca sem
   mudanças de schema.

## Credenciais de demonstração

Após rodar `npm run db:seed`, os usuários abaixo ficam disponíveis — todos
com a senha **`Demo@123`**. Este ambiente é **dados fictícios de
demonstração** (banner e sinalização explícita nas telas e nos PDFs
gerados).

| Perfil | E-mail |
|---|---|
| Superadministrador | `superadmin@patiogestor.demo` |
| Administrador | `admin@patiogestor.demo` |
| Gestor do empreendimento | `gestor@patiogestor.demo` |
| Financeiro | `financeiro@patiogestor.demo` |
| Operacional/Manutenção | `operacional@patiogestor.demo` |
| Consulta | `consulta@patiogestor.demo` |
| Locatário (portal) | `locatario@patiogestor.demo` |

O seed cria a empresa **Grupo Demonstração Administração de Imóveis Ltda.**
com dois empreendimentos (**Pátio Tijuco** e **Pátio Oxford**), 5 setores, 22
unidades em diferentes situações, 8 locatários, 10 leads em diferentes
etapas do funil, 2 propostas, 10 contratos (ativos, próximo do vencimento e
uma minuta), cobranças pagas/pendentes/vencidas, 5 chamados de manutenção em
diferentes status, 2 vistorias (uma de entrada já realizada com checklist
preenchido, uma periódica agendada), documentos de exemplo (incluindo uma
planta interativa com unidades posicionadas) e notificação inicial. Veja o
guia completo em
[`docs/admin-quickstart.md`](docs/admin-quickstart.md).

**Estas credenciais e senhas simples existem apenas para uso local/demo.**
Nunca reutilize esta senha ou este fluxo de seed em um ambiente de produção
com dados reais.

## Segurança, LGPD e auditoria

- Senhas com hash `bcrypt` (nunca armazenadas em texto plano).
- Validação de entrada no cliente (Zod + React Hook Form) **e** no servidor
  (o mesmo schema Zod é reaplicado em cada Server Action — o frontend nunca
  é a única barreira).
- Toda ação sensível verifica a permissão do perfil no servidor
  (`requirePermission`) antes de tocar no banco.
- Auditoria (`audit_logs`) para login, criação, alteração, exclusão lógica,
  mudança de status, aprovação, cancelamento, baixa financeira, estorno,
  reajuste, download de documento e alteração de permissões — nunca editável
  por usuários comuns (não há tela nem action de edição/remoção de logs).
- Isolamento de dados por empresa/empreendimento validado no servidor em
  toda consulta e escrita (não apenas ocultando elementos na UI).
- Arquivos marcados `isPrivate` no modelo de dados; a estrutura já prevê
  URLs assinadas/temporárias como próximo passo ao migrar para Supabase
  Storage.
- Nenhuma credencial de e-mail/SMS/WhatsApp é simulada: sem provedor
  configurado, o sistema mostra explicitamente ao usuário que o envio não
  está ativo, em vez de fingir que enviou algo.
- Boas práticas de LGPD: dados de demonstração claramente identificados
  (`isDemo: true` no banco e avisos visuais nas telas e PDFs), exclusão
  lógica preserva histórico sem apagar dados de terceiros indevidamente,
  dados bancários de proprietários armazenados sem exposição na listagem
  padrão.

## Limitações conhecidas

Sendo direto sobre o que **não** está pronto ou está apenas parcialmente
implementado, para não superestimar o entregável:

- **Envio real de e-mail**: `src/lib/email.ts` integra com a API do Resend e
  é ativado automaticamente quando `RESEND_API_KEY` está definido, mas essa
  integração **nunca foi testada contra um provedor real** — nenhuma
  credencial estava disponível durante o desenvolvimento (decisão explícita:
  implementar pronto para ativar, sem esperar por credenciais). Sem a
  chave, convites de usuário e recuperação de senha geram o link e o exibem
  em tela (claramente sinalizado, nunca "enviados" silenciosamente). WhatsApp
  /SMS/push não têm integração nenhuma implementada — a central de
  notificações internas (`NotificationType`) cobre apenas o que aparece
  dentro do próprio sistema.
- **Upload de arquivos em disco local por padrão**: `src/lib/storage.ts` já
  implementa o envio para Supabase Storage (bucket privado + URLs assinadas
  temporárias), ativado automaticamente quando
  `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` estão definidos —
  mas, pela mesma razão do e-mail, **nunca foi testado contra um bucket
  real**. Sem essas variáveis (o padrão deste ambiente), os arquivos vão
  para `public/uploads/`, o que funciona localmente mas **não é adequado
  para produção na Vercel** (filesystem efêmero).
- **Row Level Security do Postgres**: não está ativo — decisão deliberada
  (autenticação não é via Supabase Auth nesta versão, e migrar exigiria
  reescrever o fluxo de login com risco de regressão sem trazer proteção
  adicional real, já que a aplicação usa uma única credencial de serviço do
  Prisma). O isolamento de dados é garantido e reforçado na camada de
  aplicação (`assertCompanyAccess`/`assertPropertyAccess` em
  `src/lib/session.ts`, chamados em toda Server Action que cria ou altera
  dados de empresa/empreendimento — ver seção Arquitetura acima), coberto por
  testes de integração dedicados que tentam acessar dados de outra empresa e
  esperam falha (`tests/integration/company-isolation.test.ts`).
  `supabase/policies.sql` documenta as políticas RLS de referência caso o
  projeto migre para Supabase Auth no futuro.
- **Índices econômicos (IGP-M/IPCA/INPC)**: tabela de registro manual
  pronta, sem integração automática com fonte oficial (FGV/IBGE) — por
  desenho, para não inventar valores de índice.
- **Kanban de CRM/manutenção**: movimentação por seleção/botões, não por
  arraste (drag-and-drop) — funcional, mas menos fluido visualmente.
- **Autenticação em dois fatores**: mencionada no prompt como "opção
  futura" — não implementada nesta versão.
- **TanStack Table**: instalada como dependência, mas as tabelas atuais
  usam paginação/filtro via query params no servidor em vez do client-side
  table state da biblioteca.
- **Dois avisos de build** (não bloqueantes) relacionados a
  Compression/DecompressionStream no Edge Runtime — ver seção de Build.

## Próximas evoluções

1. Migrar upload de arquivos para Supabase Storage com URLs assinadas.
2. Conectar um provedor de e-mail (Resend/SMTP) para convites e recuperação
   de senha, e depois WhatsApp/SMS/push para a central de notificações.
3. Implementar a UI de vistorias/checklists sobre o modelo de dados já
   existente.
4. Editor de planta interativa com arraste (drag) em vez de desenho manual
   de retângulo.
5. Drag-and-drop no CRM e no Kanban de manutenção.
6. Integração automática de índices econômicos (IGP-M/IPCA/INPC) com fonte
   oficial.
7. Autenticação em dois fatores.
8. Job agendado (cron / Supabase Edge Function) para sincronizar cobranças
   vencidas e gerar notificações, hoje calculado sob demanda ao abrir as
   telas correspondentes.
