import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s } from "./document-styles";
import { appConfig } from "@/config/app";
import { formatCurrency, formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/labels";

interface ReceiptPdfProps {
  payment: { id: string; amount: unknown; method: string; paidAt: Date; reference: string | null };
  tenant: { name: string; document: string };
  property: { name: string };
  contractNumber: string;
  chargeCompetence: Date;
  emittedByName: string;
}

export function ReceiptDocument({ payment, tenant, property, contractNumber, chargeCompetence, emittedByName }: ReceiptPdfProps) {
  return (
    <Document title={`Recibo ${payment.id}`}>
      <Page size="A4" style={s.page}>
        <View style={s.demoBanner}>
          <Text>{appConfig.demoModeLabel}</Text>
        </View>
        <View style={s.headerRow}>
          <View>
            <Text style={s.brand}>{appConfig.systemName}</Text>
            <Text style={s.muted}>{property.name}</Text>
          </View>
          <View>
            <Text style={s.muted}>Emitido em {formatDate(new Date())}</Text>
            <Text style={s.muted}>Por {emittedByName}</Text>
          </View>
        </View>

        <Text style={s.title}>Recibo de pagamento</Text>
        <Text style={s.subtitle}>Referente ao contrato {contractNumber} — competência {formatDate(chargeCompetence)}</Text>

        <View style={s.section}>
          <Text>
            Recebemos de <Text style={s.value}>{tenant.name}</Text> ({tenant.document}) a quantia de{" "}
            <Text style={s.value}>{formatCurrency(payment.amount)}</Text>, paga em {formatDate(payment.paidAt)} via{" "}
            {paymentMethodLabels[payment.method]}
            {payment.reference ? `, referência ${payment.reference}` : ""}.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text>{appConfig.systemName} — Documento gerado automaticamente</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
