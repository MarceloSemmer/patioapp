-- ============================================================================
-- PátioGestor — Políticas de Row Level Security (RLS) de referência
-- ============================================================================
--
-- IMPORTANTE — LEIA ANTES DE APLICAR:
--
-- Esta versão de demonstração do PátioGestor autentica usuários com
-- NextAuth/Auth.js (Credentials provider + bcrypt), não com o Supabase Auth,
-- e todo o isolamento de dados por empresa/empreendimento/locatário é feito
-- na CAMADA DE APLICAÇÃO (ver src/lib/session.ts, src/lib/scoped-queries.ts
-- e a validação de acesso em cada server action de src/server/actions/*.ts).
-- O Prisma Client acessa o Postgres com uma única credencial de serviço,
-- portanto o RLS do Postgres NÃO está ativo nesta configuração — a proteção
-- real hoje vem inteiramente das checagens em código no servidor.
--
-- Este arquivo documenta como as políticas RLS DEVERIAM ser configuradas se o
-- projeto migrar para o padrão recomendado do Supabase (Supabase Auth +
-- PostgREST/Prisma com a chave anônima respeitando RLS por usuário). Ele NÃO
-- é executado automaticamente pelas migrations do Prisma e não deve ser
-- aplicado sem antes:
--   1. Migrar a autenticação para o Supabase Auth (ou mapear o usuário do
--      NextAuth para auth.uid() por algum mecanismo equivalente);
--   2. Criar a função app_user_id() abaixo, adaptando-a à estratégia de
--      autenticação escolhida;
--   3. Revisar cada policy com a equipe responsável pela segurança dos dados
--      antes de habilitar RLS em produção.
--
-- ============================================================================

-- Função auxiliar: obtém o ID do usuário (tabela public.users) autenticado.
-- Assume que auth.uid() (Supabase Auth) foi previamente associado a uma linha
-- de public.users com o mesmo UUID. Ajuste conforme a estratégia de auth.
create or replace function app_user_id() returns uuid
language sql stable
as $$
  select auth.uid();
$$;

-- Função auxiliar: perfil (role) do usuário autenticado.
create or replace function app_user_role() returns text
language sql stable
as $$
  select role::text from public.users where id = app_user_id();
$$;

-- Função auxiliar: lista de company_id às quais o usuário tem acesso.
create or replace function app_user_company_ids() returns setof uuid
language sql stable
as $$
  select company_id from public.user_companies where user_id = app_user_id();
$$;

-- Função auxiliar: lista de property_id às quais o usuário tem acesso direto
-- (usada para restringir GESTOR/OPERACIONAL a empreendimentos específicos).
create or replace function app_user_property_ids() returns setof uuid
language sql stable
as $$
  select property_id from public.user_properties where user_id = app_user_id();
$$;

-- Função auxiliar: tenant_id do locatário autenticado (portal), quando houver.
create or replace function app_user_tenant_id() returns uuid
language sql stable
as $$
  select id from public.tenants where portal_user_id = app_user_id();
$$;

-- ============================================================================
-- Habilitar RLS nas tabelas sensíveis
-- ============================================================================

alter table public.companies enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.contracts enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;
alter table public.maintenance_tickets enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- ============================================================================
-- companies — SUPERADMIN vê tudo; demais perfis veem apenas as empresas
-- vinculadas via user_companies.
-- ============================================================================
create policy companies_select on public.companies
  for select using (
    app_user_role() = 'SUPERADMIN'
    or id in (select app_user_company_ids())
  );

create policy companies_write_superadmin_only on public.companies
  for all using (app_user_role() = 'SUPERADMIN')
  with check (app_user_role() = 'SUPERADMIN');

-- ============================================================================
-- properties — escopo por empresa; GESTOR/OPERACIONAL podem ainda ser
-- restritos a um subconjunto de empreendimentos via user_properties.
-- ============================================================================
create policy properties_select on public.properties
  for select using (
    app_user_role() = 'SUPERADMIN'
    or (
      company_id in (select app_user_company_ids())
      and (
        app_user_role() not in ('GESTOR', 'OPERACIONAL')
        or not exists (select 1 from public.user_properties where user_id = app_user_id())
        or id in (select app_user_property_ids())
      )
    )
  );

create policy properties_write on public.properties
  for all using (
    app_user_role() in ('SUPERADMIN', 'ADMIN')
    and (app_user_role() = 'SUPERADMIN' or company_id in (select app_user_company_ids()))
  )
  with check (
    app_user_role() in ('SUPERADMIN', 'ADMIN')
    and (app_user_role() = 'SUPERADMIN' or company_id in (select app_user_company_ids()))
  );

-- ============================================================================
-- units — segue o escopo do empreendimento (property) ao qual pertence.
-- ============================================================================
create policy units_select on public.units
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = units.property_id
        and (
          app_user_role() = 'SUPERADMIN'
          or p.company_id in (select app_user_company_ids())
        )
    )
  );

create policy units_write on public.units
  for all using (
    app_user_role() in ('SUPERADMIN', 'ADMIN', 'GESTOR')
    and exists (
      select 1 from public.properties p
      where p.id = units.property_id
        and (app_user_role() = 'SUPERADMIN' or p.company_id in (select app_user_company_ids()))
    )
  );

-- ============================================================================
-- tenants — escopo por empresa para a equipe interna; o próprio locatário
-- (perfil LOCATARIO) só enxerga o próprio registro.
-- ============================================================================
create policy tenants_select_staff on public.tenants
  for select using (
    app_user_role() <> 'LOCATARIO'
    and (app_user_role() = 'SUPERADMIN' or company_id in (select app_user_company_ids()))
  );

create policy tenants_select_self on public.tenants
  for select using (
    app_user_role() = 'LOCATARIO' and id = app_user_tenant_id()
  );

create policy tenants_write_staff on public.tenants
  for all using (
    app_user_role() in ('SUPERADMIN', 'ADMIN', 'GESTOR')
    and (app_user_role() = 'SUPERADMIN' or company_id in (select app_user_company_ids()))
  );

-- ============================================================================
-- contracts / charges / payments — locatário só vê os próprios; equipe
-- interna vê conforme o escopo do empreendimento do contrato.
-- ============================================================================
create policy contracts_select_staff on public.contracts
  for select using (
    app_user_role() <> 'LOCATARIO'
    and exists (
      select 1 from public.properties p
      where p.id = contracts.property_id
        and (app_user_role() = 'SUPERADMIN' or p.company_id in (select app_user_company_ids()))
    )
  );

create policy contracts_select_self on public.contracts
  for select using (
    app_user_role() = 'LOCATARIO' and tenant_id = app_user_tenant_id()
  );

create policy charges_select_staff on public.charges
  for select using (
    app_user_role() in ('SUPERADMIN', 'ADMIN', 'GESTOR', 'FINANCEIRO', 'CONSULTA')
    and exists (
      select 1 from public.contracts c
      join public.properties p on p.id = c.property_id
      where c.id = charges.contract_id
        and (app_user_role() = 'SUPERADMIN' or p.company_id in (select app_user_company_ids()))
    )
  );

create policy charges_select_self on public.charges
  for select using (
    app_user_role() = 'LOCATARIO'
    and exists (select 1 from public.contracts c where c.id = charges.contract_id and c.tenant_id = app_user_tenant_id())
  );

-- ============================================================================
-- documents — arquivos privados nunca ficam públicos; o acesso segue o
-- mesmo escopo de empresa/locatário, e o storage correspondente (bucket
-- Supabase Storage) deve usar URLs assinadas e temporárias, nunca um bucket
-- público, para os documentos com is_private = true.
-- ============================================================================
create policy documents_select_staff on public.documents
  for select using (
    app_user_role() <> 'LOCATARIO'
    and (app_user_role() = 'SUPERADMIN' or company_id in (select app_user_company_ids()))
  );

create policy documents_select_self on public.documents
  for select using (
    app_user_role() = 'LOCATARIO' and tenant_id = app_user_tenant_id()
  );

-- ============================================================================
-- audit_logs — somente leitura para quem tem permissão de auditoria; nunca
-- editável ou removível por usuários comuns (nenhuma policy de update/delete
-- é criada intencionalmente).
-- ============================================================================
create policy audit_logs_select on public.audit_logs
  for select using (
    app_user_role() in ('SUPERADMIN', 'ADMIN')
    and (app_user_role() = 'SUPERADMIN' or company_id in (select app_user_company_ids()))
  );

create policy audit_logs_insert_service_only on public.audit_logs
  for insert with check (false); -- inserções somente via role de serviço (bypassa RLS)

-- ============================================================================
-- notifications — cada usuário só vê as próprias notificações.
-- ============================================================================
create policy notifications_select_own on public.notifications
  for select using (user_id = app_user_id());

create policy notifications_update_own on public.notifications
  for update using (user_id = app_user_id())
  with check (user_id = app_user_id());
