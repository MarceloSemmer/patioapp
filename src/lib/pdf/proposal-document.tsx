import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s } from "./document-styles";
import { appConfig } from "@/config/app";
import { formatArea, formatCurrency, formatDate } from "@/lib/format";
import { adjustmentIndexLabels, guaranteeTypeLabels } from "@/lib/labels";

interface ProposalPdfProps {
  proposal: {
    number: string;
    totalArea: unknown;
    rentValue: unknown;
    condoFee: unknown;
    iptuFee: unknown;
    promoFundFee: unknown;
    gracePeriodDays: number | null;
    contractTermMonths: number;
    adjustmentIndex: string;
    guaranteeType: string;
    guaranteeValue: unknown;
    validUntil: Date;
    specialConditions: string | null;
    createdAt: Date;
  };
  property: { name: string; city: string | null; state: string | null };
  tenant: { name: string; document: string };
  units: { code: string; totalArea: unknown }[];
  emittedByName: string;
}

export function ProposalDocument({ proposal, property, tenant, units, emittedByName }: ProposalPdfProps) {
  const monthlyTotal =
    Number(proposal.rentValue) + Number(proposal.condoFee ?? 0) + Number(proposal.iptuFee ?? 0) + Number(proposal.promoFundFee ?? 0);

  return (
    <Document title={`Proposta ${proposal.number}`}>
      <Page size="A4" style={s.page}>
        <View style={s.demoBanner}>
          <Text>{appConfig.demoModeLabel}</Text>
        </View>
        <View style={s.headerRow}>
          <View>
            <Text style={s.brand}>{appConfig.systemName}</Text>
            <Text style={s.muted}>{property.name}</Text>
            {(property.city || property.state) && (
              <Text style={s.muted}>
                {property.city}
                {property.state ? `/${property.state}` : ""}
              </Text>
            )}
          </View>
          <View>
            <Text style={s.muted}>Emitido em {formatDate(proposal.createdAt)}</Text>
            <Text style={s.muted}>Por {emittedByName}</Text>
          </View>
        </View>

        <Text style={s.title}>Proposta comercial {proposal.number}</Text>
        <Text style={s.subtitle}>Válida até {formatDate(proposal.validUntil)}</Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Locatário</Text>
          <Text style={s.value}>{tenant.name}</Text>
          <Text style={s.muted}>{tenant.document}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Unidades propostas</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableHeader]}>
              <Text style={{ flex: 1 }}>Unidade</Text>
              <Text style={{ flex: 1 }}>Área</Text>
            </View>
            {units.map((u) => (
              <View style={s.tableRow} key={u.code}>
                <Text style={{ flex: 1 }}>{u.code}</Text>
                <Text style={{ flex: 1 }}>{formatArea(u.totalArea)}</Text>
              </View>
            ))}
          </View>
          <Text style={{ marginTop: 6 }}>Área total: {formatArea(proposal.totalArea)}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Condições comerciais</Text>
          <View style={s.row}>
            <Text style={s.col}>Aluguel: {formatCurrency(proposal.rentValue)}</Text>
            <Text style={s.col}>Condomínio: {proposal.condoFee ? formatCurrency(proposal.condoFee) : "—"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.col}>IPTU: {proposal.iptuFee ? formatCurrency(proposal.iptuFee) : "—"}</Text>
            <Text style={s.col}>Fundo de promoção: {proposal.promoFundFee ? formatCurrency(proposal.promoFundFee) : "—"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.col}>Total mensal estimado: {formatCurrency(monthlyTotal)}</Text>
            <Text style={s.col}>Carência: {proposal.gracePeriodDays} dias</Text>
          </View>
          <View style={s.row}>
            <Text style={s.col}>Prazo do contrato: {proposal.contractTermMonths} meses</Text>
            <Text style={s.col}>Índice de reajuste: {adjustmentIndexLabels[proposal.adjustmentIndex]}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.col}>Garantia: {guaranteeTypeLabels[proposal.guaranteeType]}</Text>
            <Text style={s.col}>Valor da garantia: {proposal.guaranteeValue ? formatCurrency(proposal.guaranteeValue) : "—"}</Text>
          </View>
        </View>

        {proposal.specialConditions && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Condições especiais</Text>
            <Text>{proposal.specialConditions}</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>{appConfig.systemName} — Documento gerado automaticamente</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
