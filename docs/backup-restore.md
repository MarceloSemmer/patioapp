# Backup e restauração

## PostgreSQL local / self-hosted

**Backup completo (schema + dados):**

```bash
pg_dump "postgresql://postgres:postgres@localhost:5432/patiogestor" \
  --format=custom --file=patiogestor_$(date +%Y%m%d_%H%M).dump
```

**Restauração em um banco novo:**

```bash
createdb patiogestor_restore
pg_restore --dbname="postgresql://postgres:postgres@localhost:5432/patiogestor_restore" \
  --no-owner --no-privileges patiogestor_20260101_1200.dump
```

**Backup apenas de dados (sem schema, útil para migrar entre ambientes já
com as migrations aplicadas):**

```bash
pg_dump "$DATABASE_URL" --format=custom --data-only --file=dados.dump
pg_restore --dbname="$DATABASE_URL_DESTINO" --data-only --disable-triggers dados.dump
```

## Supabase

O Supabase gerencia backups automáticos diários (retenção conforme o plano
contratado) em **Project Settings → Database → Backups**, com restauração via
painel (point-in-time recovery nos planos Pro+) ou:

```bash
# Backup manual via connection string do Supabase (porta 5432, não a de pooling)
pg_dump "postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres" \
  --format=custom --file=backup.dump
```

Para arquivos enviados (contratos, comprovantes, plantas): nesta versão de
demonstração eles ficam em `public/uploads/` no próprio servidor (ver
limitações no README). Ao migrar para o Supabase Storage, o backup dos
buckets deve ser feito separadamente (o `pg_dump` do banco não inclui os
objetos do Storage).

## Migrations do Prisma

As migrations em `prisma/migrations/` são o histórico versionado do schema —
sempre committadas no Git. Para aplicar em um ambiente novo:

```bash
npx prisma migrate deploy
```

Nunca use `prisma migrate dev` (que pode gerar/reconciliar migrations
interativamente) em produção — apenas `migrate deploy`, que só aplica
migrations já commitadas.

## Rotina recomendada antes de mudanças estruturais

1. `pg_dump` completo do banco de produção.
2. Testar a nova migration em um banco de homologação restaurado a partir do
   backup.
3. Aplicar `prisma migrate deploy` em produção apenas após validar.
