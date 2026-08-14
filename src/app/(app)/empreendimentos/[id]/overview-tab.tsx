import { formatArea, formatNumber } from "@/lib/format";

interface OverviewProperty {
  cnpj: string | null;
  municipalRegistry: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  responsibleName: string | null;
  openingHours: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  totalArea: unknown;
  builtArea: unknown;
  leasableArea: unknown;
  parkingSpaces: number | null;
  amenities: string[];
  description: string | null;
  internalRules: string | null;
  notes: string | null;
}

export function OverviewTab({ property }: { property: OverviewProperty }) {
  const address = [property.street, property.number, property.complement].filter(Boolean).join(", ");
  const cityState = [property.neighborhood, property.city && property.state ? `${property.city}/${property.state}` : property.city]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {property.description && (
          <section>
            <h3 className="mb-1 text-sm font-medium">Descrição</h3>
            <p className="text-sm text-muted-foreground">{property.description}</p>
          </section>
        )}
        <section>
          <h3 className="mb-1 text-sm font-medium">Endereço</h3>
          <p className="text-sm text-muted-foreground">
            {address || "Não informado"} {property.zipCode ? `· CEP ${property.zipCode}` : ""}
          </p>
          {cityState && <p className="text-sm text-muted-foreground">{cityState}</p>}
        </section>
        {property.amenities.length > 0 && (
          <section>
            <h3 className="mb-1 text-sm font-medium">Comodidades</h3>
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.map((a) => (
                <span key={a} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}
        {property.internalRules && (
          <section>
            <h3 className="mb-1 text-sm font-medium">Regulamento interno</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{property.internalRules}</p>
          </section>
        )}
        {property.notes && (
          <section>
            <h3 className="mb-1 text-sm font-medium">Observações</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{property.notes}</p>
          </section>
        )}
      </div>
      <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
        <InfoRow label="CNPJ" value={property.cnpj} />
        <InfoRow label="Inscrição municipal" value={property.municipalRegistry} />
        <InfoRow label="Telefone" value={property.phone} />
        <InfoRow label="WhatsApp" value={property.whatsapp} />
        <InfoRow label="E-mail" value={property.email} />
        <InfoRow label="Responsável" value={property.responsibleName} />
        <InfoRow label="Horário de funcionamento" value={property.openingHours} />
        <InfoRow label="Área total" value={formatArea(property.totalArea)} />
        <InfoRow label="Área construída" value={property.builtArea ? formatArea(property.builtArea) : null} />
        <InfoRow label="Área locável" value={formatArea(property.leasableArea)} />
        <InfoRow label="Vagas" value={property.parkingSpaces ? formatNumber(property.parkingSpaces) : null} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}
