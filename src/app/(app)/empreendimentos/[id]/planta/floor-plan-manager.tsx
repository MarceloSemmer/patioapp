"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/upload/file-upload";
import { createFloorPlan, upsertFloorPlanArea, deleteFloorPlanArea } from "@/server/actions/floor-plan-actions";
import { unitStatusLabels, unitStatusPlanColors } from "@/lib/labels";
import { formatArea, formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/layout/empty-state";
import { Map, ZoomIn, ZoomOut, Pencil } from "lucide-react";

interface UnitLite {
  id: string;
  code: string;
  commercialName: string | null;
  status: string;
}

interface Area {
  id: string;
  unitId: string;
  x: unknown;
  y: unknown;
  width: unknown;
  height: unknown;
  unit: UnitLite & { totalArea: unknown; suggestedRent: unknown };
}

interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
  areas: Area[];
}

export function FloorPlanManager({
  propertyId,
  floorPlans,
  units,
  canManage,
}: {
  propertyId: string;
  floorPlans: FloorPlan[];
  units: UnitLite[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(floorPlans[0]?.id);
  const active = floorPlans.find((f) => f.id === activeId) ?? floorPlans[0];
  const [editMode, setEditMode] = useState(false);

  if (floorPlans.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Map}
          title="Nenhuma planta cadastrada"
          description="Envie a imagem da planta do empreendimento para posicionar as unidades."
        />
        {canManage && <NewFloorPlanForm propertyId={propertyId} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={active?.id} onValueChange={setActiveId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {floorPlans.map((fp) => (
              <SelectItem key={fp.id} value={fp.id}>
                {fp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManage && (
          <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode((v) => !v)}>
            <Pencil className="h-3.5 w-3.5" /> {editMode ? "Concluir edição" : "Editar posições"}
          </Button>
        )}
        {canManage && <NewFloorPlanForm propertyId={propertyId} compact />}
      </div>

      {active && (
        <FloorPlanCanvas
          floorPlan={active}
          allUnits={units}
          editMode={editMode && canManage}
          onChanged={() => router.refresh()}
        />
      )}

      <div className="flex flex-wrap gap-3 rounded-lg border bg-card p-3 text-xs">
        <span className="font-medium">Legenda:</span>
        {Object.entries(unitStatusPlanColors)
          .filter(([status]) => ["DISPONIVEL", "EM_NEGOCIACAO", "RESERVADA", "OCUPADA"].includes(status))
          .map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
              {unitStatusLabels[status]}
            </span>
          ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: unitStatusPlanColors.BLOQUEADA }} />
          Bloqueada / inativa / manutenção
        </span>
      </div>
    </div>
  );
}

function NewFloorPlanForm({ propertyId, compact }: { propertyId: string; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Envie a imagem da planta antes de salvar.");
      return;
    }
    setSubmitting(true);
    try {
      await createFloorPlan({ propertyId, name, imageUrl });
      toast.success("Planta cadastrada.");
      setOpen(false);
      setName("");
      setImageUrl("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar a planta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant={compact ? "outline" : "default"} onClick={() => setOpen(true)}>
        Enviar nova planta
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova planta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="fp-name">Nome</Label>
            <Input id="fp-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Planta térreo" />
          </div>
          <div>
            <Label>Imagem (PNG, JPG ou PDF)</Label>
            <div className="mt-1 flex items-center gap-2">
              <FileUpload category="floor-plans" onUploaded={(url) => setImageUrl(url)} />
              {imageUrl && <span className="text-xs text-muted-foreground">Arquivo enviado ✓</span>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FloorPlanCanvas({
  floorPlan,
  allUnits,
  editMode,
  onChanged,
}: {
  floorPlan: FloorPlan;
  allUnits: UnitLite[];
  editMode: boolean;
  onChanged: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [drawing, setDrawing] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [popover, setPopover] = useState<Area | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const mappedUnitIds = new Set(floorPlan.areas.map((a) => a.unitId));
  const unmappedUnits = allUnits.filter((u) => !mappedUnitIds.has(u.id));

  function getRelativePosition(e: React.MouseEvent): { x: number; y: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!editMode || !selectedUnitId) return;
    const pos = getRelativePosition(e);
    setDragStart(pos);
    setDrawing({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!editMode || !dragStart) return;
    const pos = getRelativePosition(e);
    setDrawing({
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      width: Math.abs(pos.x - dragStart.x),
      height: Math.abs(pos.y - dragStart.y),
    });
  }

  async function handleMouseUp() {
    if (!editMode || !dragStart || !drawing || !selectedUnitId) {
      setDragStart(null);
      return;
    }
    setDragStart(null);
    if (drawing.width < 1 || drawing.height < 1) {
      setDrawing(null);
      return;
    }
    try {
      await upsertFloorPlanArea({
        floorPlanId: floorPlan.id,
        unitId: selectedUnitId,
        x: drawing.x,
        y: drawing.y,
        width: drawing.width,
        height: drawing.height,
      });
      toast.success("Posição da unidade salva.");
      setSelectedUnitId("");
      setDrawing(null);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar a posição.");
    }
  }

  return (
    <div className="space-y-3">
      {editMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <span>1. Selecione a unidade</span>
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Unidade a posicionar" />
            </SelectTrigger>
            <SelectContent>
              {unmappedUnits.length === 0 && floorPlan.areas.length === allUnits.length ? (
                <SelectItem value="none" disabled>
                  Todas as unidades já posicionadas
                </SelectItem>
              ) : (
                allUnits.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.code} {mappedUnitIds.has(u.id) ? "(reposicionar)" : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <span>2. Desenhe um retângulo sobre a planta</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label="Diminuir zoom">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Aumentar zoom">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
      </div>

      <div className="overflow-auto rounded-lg border bg-muted/20 p-2" style={{ maxHeight: 640 }}>
        <div
          ref={containerRef}
          className="relative select-none"
          style={{ width: `${zoom * 100}%`, cursor: editMode && selectedUnitId ? "crosshair" : "default" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setDragStart(null)}
        >
          <Image
            src={floorPlan.imageUrl}
            alt={floorPlan.name}
            width={1600}
            height={1000}
            className="block h-auto w-full"
            unoptimized
          />
          {floorPlan.areas.map((area) => (
            <button
              key={area.id}
              type="button"
              className="absolute flex items-center justify-center border-2 text-[10px] font-semibold text-white shadow-sm transition-opacity hover:opacity-80"
              style={{
                left: `${Number(area.x)}%`,
                top: `${Number(area.y)}%`,
                width: `${Number(area.width)}%`,
                height: `${Number(area.height)}%`,
                backgroundColor: `${unitStatusPlanColors[area.unit.status]}b3`,
                borderColor: unitStatusPlanColors[area.unit.status],
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (editMode) {
                  if (confirm(`Remover posição de ${area.unit.code}?`)) {
                    deleteFloorPlanArea(area.id).then(onChanged);
                  }
                  return;
                }
                setPopover(area);
              }}
            >
              {area.unit.code}
            </button>
          ))}
          {drawing && (
            <div
              className="absolute border-2 border-dashed border-primary bg-primary/20"
              style={{
                left: `${drawing.x}%`,
                top: `${drawing.y}%`,
                width: `${drawing.width}%`,
                height: `${drawing.height}%`,
              }}
            />
          )}
        </div>
      </div>

      <Dialog open={!!popover} onOpenChange={(v) => !v && setPopover(null)}>
        <DialogContent className="max-w-sm">
          {popover && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {popover.unit.code}
                  <Badge>{unitStatusLabels[popover.unit.status]}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-1 text-sm">
                {popover.unit.commercialName && <p>{popover.unit.commercialName}</p>}
                <p className="text-muted-foreground">Área: {formatArea(popover.unit.totalArea)}</p>
                {Boolean(popover.unit.suggestedRent) && (
                  <p className="text-muted-foreground">Aluguel sugerido: {formatCurrency(popover.unit.suggestedRent)}</p>
                )}
              </div>
              <DialogFooter>
                <Button asChild>
                  <Link href={`/unidades/${popover.unit.id}`}>Ver ficha completa</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
