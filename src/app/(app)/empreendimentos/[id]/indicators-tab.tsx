import { computeOccupancy } from "@/lib/metrics";
import { formatArea, formatPercent } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

export async function IndicatorsTab({ propertyId }: { propertyId: string }) {
  const occupancy = await computeOccupancy({ propertyId });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Ocupação por unidades</p>
        <p className="mt-1 text-2xl font-semibold">{formatPercent(occupancy.occupancyByUnits)}</p>
        <Progress value={occupancy.occupancyByUnits} className="mt-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {occupancy.occupiedUnits} ocupadas de {occupancy.totalUnits} unidades
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Ocupação por área</p>
        <p className="mt-1 text-2xl font-semibold">{formatPercent(occupancy.occupancyByArea)}</p>
        <Progress value={occupancy.occupancyByArea} className="mt-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {formatArea(occupancy.occupiedArea)} ocupados de {formatArea(occupancy.totalArea)}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Disponíveis</p>
        <p className="mt-1 text-2xl font-semibold">{occupancy.availableUnits}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Reservadas / em negociação</p>
        <p className="mt-1 text-2xl font-semibold">{occupancy.reservedUnits}</p>
      </div>
    </div>
  );
}
