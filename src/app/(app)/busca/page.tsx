import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Search } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Busca" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireSession();
  const { q } = await searchParams;
  const companyIds = companyScope(session);

  if (!q) {
    return (
      <div>
        <PageHeader title="Busca" />
        <EmptyState icon={Search} title="Digite um termo para buscar" />
      </div>
    );
  }

  const propertyFilter = { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) };

  const [properties, units, tenants, contracts] = await Promise.all([
    prisma.property.findMany({ where: { ...propertyFilter, name: { contains: q, mode: "insensitive" } }, take: 10 }),
    prisma.unit.findMany({
      where: { deletedAt: null, property: propertyFilter, OR: [{ code: { contains: q, mode: "insensitive" } }, { commercialName: { contains: q, mode: "insensitive" } }] },
      include: { property: { select: { name: true } } },
      take: 10,
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}), OR: [{ name: { contains: q, mode: "insensitive" } }, { document: { contains: q } }] },
      take: 10,
    }),
    prisma.contract.findMany({
      where: { deletedAt: null, property: propertyFilter, number: { contains: q, mode: "insensitive" } },
      include: { tenant: { select: { name: true } } },
      take: 10,
    }),
  ]);

  const noResults = properties.length + units.length + tenants.length + contracts.length === 0;

  return (
    <div>
      <PageHeader title={`Resultados para "${q}"`} />
      {noResults ? (
        <EmptyState icon={Search} title="Nenhum resultado encontrado" />
      ) : (
        <div className="space-y-6">
          <ResultSection title="Empreendimentos">
            {properties.map((p) => (
              <ResultLink key={p.id} href={`/empreendimentos/${p.id}`} label={p.name} />
            ))}
          </ResultSection>
          <ResultSection title="Unidades">
            {units.map((u) => (
              <ResultLink key={u.id} href={`/unidades/${u.id}`} label={`${u.code} · ${u.property.name}`} />
            ))}
          </ResultSection>
          <ResultSection title="Locatários">
            {tenants.map((t) => (
              <ResultLink key={t.id} href={`/locatarios/${t.id}`} label={t.name} />
            ))}
          </ResultSection>
          <ResultSection title="Contratos">
            {contracts.map((c) => (
              <ResultLink key={c.id} href={`/contratos/${c.id}`} label={`${c.number} · ${c.tenant.name}`} />
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function ResultLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-md border bg-card p-2 text-sm hover:bg-accent">
      {label}
    </Link>
  );
}
