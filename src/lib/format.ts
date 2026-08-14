import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Aceita number/string/Decimal (via unknown, já que campos Decimal do Prisma
 * costumam chegar tipados como `unknown` em props de componentes cliente)
 * além de null/undefined.
 */
type NumericInput = unknown;

function toNumber(value: NumericInput): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) return Number(value.toString()) || 0;
  return 0;
}

export function formatCurrency(value: NumericInput): string {
  return toNumber(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(value: NumericInput, fractionDigits = 0): string {
  return toNumber(value).toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatArea(value: NumericInput): string {
  return `${formatNumber(value, 2)} m²`;
}

export function formatPercent(value: NumericInput, fractionDigits = 2): string {
  return `${toNumber(value).toLocaleString("pt-BR", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}%`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
}
