import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X } from "lucide-react";
import { unitStatusColors, unitStatusLabels, unitTypeLabels } from "@/lib/labels";
import { formatArea, formatCurrency } from "@/lib/format";

export const metadata = { title: "Comparar unidades" };

export default async function CompareUnitsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const companyIds = companyScope(session);
  const ids = (params.ids ?? "").split(",").filter(Boolean);

  if (ids.length < 2) {
    redirect("/unidades");
  }

  const units = await prisma.unit.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    },
    include: {
      property: { select: { name: true, city: true, state: true } },
      sector: { select: { name: true } },
    },
  });

  if (units.length < 2) {
    redirect("/unidades");
  }

  // Mantém a ordem em que as unidades foram selecionadas na listagem.
  const orderedUnits = ids.map((id) => units.find((u) => u.id === id)).filter((u): u is (typeof units)[number] => Boolean(u));

  const rentPerSqm = (unit: (typeof units)[number]) => (unit.suggestedRent ? Number(unit.suggestedRent) / Number(unit.totalArea) : null);

  const infraFeatures: { key: keyof (typeof units)[number]; label: string }[] = [
    { key: "hasElectrical", label: "Elétrica" },
    { key: "hasWater", label: "Água" },
    { key: "hasGas", label: "Gás" },
    { key: "hasExhaustion", label: "Exaustão" },
    { key: "hasInternet", label: "Internet" },
    { key: "hasAccessibility", label: "Acessibilidade" },
    { key: "hasBathroom", label: "Banheiro" },
  ];

  return (
    <div>
      <Link href="/unidades" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para unidades
      </Link>
      <PageHeader title="Comparação de unidades" description={`Comparando ${orderedUnits.length} unidades lado a lado.`} />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-40 p-3 text-left font-medium text-muted-foreground">Unidade</th>
              {orderedUnits.map((unit) => (
                <th key={unit.id} className="p-3 text-left">
                  <Link href={`/unidades/${unit.id}`} className="font-semibold hover:underline">
                    {unit.code}
                  </Link>
                  {unit.commercialName && <p className="text-xs font-normal text-muted-foreground">{unit.commercialName}</p>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Situação">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  <Badge variant={unitStatusColors[unit.status]}>{unitStatusLabels[unit.status]}</Badge>
                </td>
              ))}
            </Row>
            <Row label="Empreendimento">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {unit.property.name}
                </td>
              ))}
            </Row>
            <Row label="Localização">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {[unit.property.city, unit.property.state].filter(Boolean).join("/") || "—"}
                </td>
              ))}
            </Row>
            <Row label="Setor">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {unit.sector?.name ?? "—"}
                </td>
              ))}
            </Row>
            <Row label="Tipo">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {unitTypeLabels[unit.type]}
                </td>
              ))}
            </Row>
            <Row label="Área privativa">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {formatArea(unit.privateArea)}
                </td>
              ))}
            </Row>
            <Row label="Área total">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {formatArea(unit.totalArea)}
                </td>
              ))}
            </Row>
            <Row label="Aluguel sugerido">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {unit.suggestedRent ? formatCurrency(unit.suggestedRent) : "—"}
                </td>
              ))}
            </Row>
            <Row label="Aluguel / m²">
              {orderedUnits.map((unit) => {
                const value = rentPerSqm(unit);
                return (
                  <td key={unit.id} className="p-3">
                    {value ? formatCurrency(value) : "—"}
                  </td>
                );
              })}
            </Row>
            <Row label="Condomínio">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {unit.condoFee ? formatCurrency(unit.condoFee) : "—"}
                </td>
              ))}
            </Row>
            <Row label="IPTU">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {unit.iptuFee ? formatCurrency(unit.iptuFee) : "—"}
                </td>
              ))}
            </Row>
            <Row label="Vagas de estacionamento">
              {orderedUnits.map((unit) => (
                <td key={unit.id} className="p-3">
                  {unit.parkingSpaces ?? "—"}
                </td>
              ))}
            </Row>
            {infraFeatures.map((feature) => (
              <Row key={feature.key} label={feature.label}>
                {orderedUnits.map((unit) => (
                  <td key={unit.id} className="p-3">
                    {unit[feature.key] ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                ))}
              </Row>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b last:border-0">
      <th className="p-3 text-left font-medium text-muted-foreground">{label}</th>
      {children}
    </tr>
  );
}
