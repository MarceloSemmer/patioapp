"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { unitStatusLabels, unitStatusPlanColors } from "@/lib/labels";
import { formatCurrency } from "@/lib/format";

interface ChartsProps {
  charts: {
    unitsByStatus: { status: string; count: number }[];
    revenueByProperty: { name: string; value: number }[];
    monthlyRevenue: { month: string; previsto: number; recebido: number }[];
    delinquencyByMonth: { month: string; valor: number }[];
    expiringByMonth: { month: string; quantidade: number }[];
    occupancyTrend: { month: string; ocupacao: number }[];
  };
}

type TooltipValue = number | string | ReadonlyArray<number | string> | undefined;
const currencyTooltipFormatter = (value: TooltipValue) => formatCurrency(Number(Array.isArray(value) ? value[0] : (value ?? 0)));
const percentTooltipFormatter = (value: TooltipValue) => `${Array.isArray(value) ? value[0] : (value ?? 0)}%`;
const statusTooltipFormatter = (value: TooltipValue, name: TooltipValue) => [
  value,
  unitStatusLabels[String(Array.isArray(name) ? name[0] : name)] ?? String(name ?? ""),
];

export function DashboardCharts({ charts }: ChartsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Evolução da taxa de ocupação">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={charts.occupancyTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} unit="%" />
            <Tooltip formatter={percentTooltipFormatter} />
            <Line type="monotone" dataKey="ocupacao" name="Ocupação" stroke="#1e3a8a" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Receita prevista vs. recebida">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={charts.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={currencyTooltipFormatter} />
            <Legend />
            <Bar dataKey="previsto" name="Prevista" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recebido" name="Recebida" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Inadimplência por mês">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={charts.delinquencyByMonth}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={currencyTooltipFormatter} />
            <Bar dataKey="valor" name="Vencido" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Distribuição das unidades por situação">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={charts.unitsByStatus} dataKey="count" nameKey="status" innerRadius={60} outerRadius={90} paddingAngle={2}>
              {charts.unitsByStatus.map((entry) => (
                <Cell key={entry.status} fill={unitStatusPlanColors[entry.status] ?? "#9ca3af"} />
              ))}
            </Pie>
            <Tooltip formatter={statusTooltipFormatter} />
            <Legend formatter={(value) => unitStatusLabels[value] ?? value} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Receita por empreendimento">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={charts.revenueByProperty} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" fontSize={12} width={120} />
            <Tooltip formatter={currencyTooltipFormatter} />
            <Bar dataKey="value" name="Receita mensal" fill="#1e3a8a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Contratos com vencimento nos próximos meses">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={charts.expiringByMonth}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="quantidade" name="Contratos" fill="#eab308" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
