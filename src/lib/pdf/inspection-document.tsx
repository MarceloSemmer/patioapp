import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s } from "./document-styles";
import { appConfig } from "@/config/app";
import { formatDate } from "@/lib/format";
import { inspectionTypeLabels, inspectionItemAnswerLabels } from "@/lib/labels";

interface InspectionPdfProps {
  inspection: {
    type: string;
    scheduledAt: Date | null;
    performedAt: Date | null;
    responsibleName: string | null;
    signedByTenant: boolean;
    notes: string | null;
    createdAt: Date;
  };
  property: { name: string; city: string | null; state: string | null };
  unit: { code: string } | null;
  tenant: { name: string; document: string } | null;
  items: { label: string; answer: string | null; notes: string | null }[];
  emittedByName: string;
}

export function InspectionDocument({ inspection, property, unit, tenant, items, emittedByName }: InspectionPdfProps) {
  return (
    <Document title={`Vistoria — ${property.name}`}>
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
            <Text style={s.muted}>Emitido em {formatDate(new Date())}</Text>
            <Text style={s.muted}>Por {emittedByName}</Text>
          </View>
        </View>

        <Text style={s.title}>Laudo de vistoria — {inspectionTypeLabels[inspection.type] ?? inspection.type}</Text>
        <Text style={s.subtitle}>
          {inspection.performedAt
            ? `Realizada em ${formatDate(inspection.performedAt)}`
            : inspection.scheduledAt
              ? `Agendada para ${formatDate(inspection.scheduledAt)}`
              : "Sem data definida"}
        </Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Imóvel</Text>
          <Text style={s.value}>{unit ? `Unidade ${unit.code}` : property.name}</Text>
          {tenant && (
            <Text style={s.muted}>
              Locatário: {tenant.name} ({tenant.document})
            </Text>
          )}
          {inspection.responsibleName && <Text style={s.muted}>Responsável: {inspection.responsibleName}</Text>}
          <Text style={s.muted}>Assinado pelo locatário: {inspection.signedByTenant ? "Sim" : "Não"}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Itens verificados</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableHeader]}>
              <Text style={{ flex: 2 }}>Item</Text>
              <Text style={{ flex: 1 }}>Resultado</Text>
              <Text style={{ flex: 2 }}>Observações</Text>
            </View>
            {items.map((item, index) => (
              <View style={s.tableRow} key={index}>
                <Text style={{ flex: 2 }}>{item.label}</Text>
                <Text style={{ flex: 1 }}>{item.answer ? inspectionItemAnswerLabels[item.answer] : "—"}</Text>
                <Text style={{ flex: 2 }}>{item.notes ?? "—"}</Text>
              </View>
            ))}
          </View>
        </View>

        {inspection.notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Observações gerais</Text>
            <Text>{inspection.notes}</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>{appConfig.systemName} — Documento gerado automaticamente</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
