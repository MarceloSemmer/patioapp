import { requireSession, companyScope } from "@/lib/session";
import { getActivePropertyId } from "@/lib/active-property";
import { getDashboardData } from "@/lib/dashboard-data";
import { syncOverdueCharges } from "@/server/actions/charge-actions";
import { PageHeader } from "@/components/layout/page-header";
import { formatArea, formatCurrency, formatPercent } from "@/lib/format";
import { appConfig } from "@/config/app";
import Link from "next/link";
import {
  Building2,
  DoorOpen,
  Wallet,
  AlertTriangle,
  FileSignature,
  KanbanSquare,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  await syncOverdueCharges();
  const companyIds = companyScope(session);
  const activePropertyId = await getActivePropertyId();

  const data = await getDashboardData({ companyIds, propertyId: activePropertyId });
  const { cards, charts } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Visão geral em tempo real dos dados cadastrados. ${appConfig.demoModeLabel}.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Card href="/empreendimentos" icon={Building2} label="Empreendimentos" value={String(cards.totalProperties)} />
        <Card icon={DoorOpen} label="Área locável total" value={formatArea(cards.totalLeasableArea)} />
        <Card icon={DoorOpen} label="Área locada" value={formatArea(cards.occupiedArea)} />
        <Card icon={DoorOpen} label="Área disponível" value={formatArea(cards.availableArea)} />
        <Card icon={TrendingUp} label="Ocupação por área" value={formatPercent(cards.occupancyByArea)} />
        <Card href="/unidades" icon={DoorOpen} label="Unidades" value={String(cards.totalUnits)} />
        <Card href="/unidades?status=OCUPADA" icon={DoorOpen} label="Unidades ocupadas" value={String(cards.occupiedUnits)} />
        <Card href="/unidades?status=DISPONIVEL" icon={DoorOpen} label="Unidades disponíveis" value={String(cards.availableUnits)} />
        <Card href="/unidades?status=RESERVADA" icon={DoorOpen} label="Reservadas" value={String(cards.reservedUnits)} />
        <Card href="/unidades?status=EM_MANUTENCAO" icon={Wrench} label="Em manutenção" value={String(cards.maintenanceUnits)} />
        <Card icon={Wallet} label="Receita contratada/mês" value={formatCurrency(cards.monthlyContractedRevenue)} />
        <Card icon={Wallet} label="Receita recebida no mês" value={formatCurrency(cards.receivedThisMonth)} />
        <Card href="/financeiro/inadimplencia" icon={AlertTriangle} label="Valores vencidos" value={formatCurrency(cards.overdueTotal)} highlight />
        <Card href="/financeiro/inadimplencia" icon={AlertTriangle} label="Índice de inadimplência" value={formatPercent(cards.delinquencyRate)} highlight={cards.delinquencyRate > 5} />
        <Card href="/contratos" icon={FileSignature} label="Contratos a vencer (6m)" value={String(cards.contractsExpiringSoon)} />
        <Card href="/crm" icon={KanbanSquare} label="Propostas em negociação" value={String(cards.negotiatingProposals)} />
        <Card href="/manutencao" icon={Wrench} label="Chamados em aberto" value={String(cards.openTickets)} />
        <Card icon={TrendingUp} label="Valor médio R$/m²" value={formatCurrency(cards.avgRentPerSqm)} />
      </div>

      <DashboardCharts charts={charts} />

      {data.properties.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          <Link href="/empreendimentos" className="text-primary hover:underline">
            Cadastre seu primeiro empreendimento
          </Link>{" "}
          para começar a visualizar indicadores.
        </p>
      )}
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div className="flex h-full flex-col justify-between rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm">
      <Icon className={`h-4 w-4 ${highlight ? "text-destructive" : "text-muted-foreground"}`} />
      <div className="mt-2">
        <p className={`text-lg font-semibold ${highlight ? "text-destructive" : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
