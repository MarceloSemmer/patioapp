"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createSector, deleteSector, updateSector, type SectorInput } from "@/server/actions/sector-actions";
import { sectorTypeLabels } from "@/lib/labels";
import { formatArea } from "@/lib/format";
import { EmptyState } from "@/components/layout/empty-state";
import { LayoutGrid } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  type: string;
  order: number;
  area: unknown;
  description: string | null;
}

export function SectorsTab({ propertyId, sectors, canManage }: { propertyId: string; sectors: Sector[]; canManage: boolean }) {
  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <SectorFormDialog propertyId={propertyId} />
        </div>
      )}
      {sectors.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="Nenhum setor cadastrado" description="Organize o empreendimento em blocos, pisos ou setores." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Ordem</TableHead>
              {canManage && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectors.map((sector) => (
              <TableRow key={sector.id}>
                <TableCell className="font-medium">{sector.name}</TableCell>
                <TableCell>{sectorTypeLabels[sector.type]}</TableCell>
                <TableCell>{sector.area ? formatArea(sector.area) : "—"}</TableCell>
                <TableCell>{sector.order}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <SectorFormDialog
                      propertyId={propertyId}
                      sector={sector}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Editar setor">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DeleteSectorButton id={sector.id} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SectorFormDialog({ propertyId, sector, trigger }: { propertyId: string; sector?: Sector; trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(sector?.name ?? "");
  const [type, setType] = useState(sector?.type ?? "SETOR");
  const [order, setOrder] = useState(String(sector?.order ?? 0));
  const [area, setArea] = useState(sector?.area ? String(sector.area) : "");
  const [description, setDescription] = useState(sector?.description ?? "");
  const isEdit = !!sector;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: SectorInput = {
        propertyId,
        name,
        type: type as SectorInput["type"],
        order: Number(order) || 0,
        area: area ? Number(area) : null,
        description: description || null,
      };
      if (isEdit) {
        await updateSector(sector.id, payload);
        toast.success("Setor atualizado.");
      } else {
        await createSector(payload);
        toast.success("Setor cadastrado.");
        setName("");
        setArea("");
        setDescription("");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o setor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> Novo setor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar setor" : "Novo setor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="sector-name">Nome</Label>
            <Input id="sector-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sector-type">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="sector-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sectorTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sector-order">Ordem de exibição</Label>
              <Input id="sector-order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="sector-area">Área (m²)</Label>
            <Input id="sector-area" type="number" step="0.01" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sector-description">Descrição</Label>
            <Textarea id="sector-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSectorButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Excluir setor">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir setor</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Setores com unidades vinculadas não podem ser excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await deleteSector(id);
                toast.success("Setor excluído.");
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Não foi possível excluir o setor.");
              } finally {
                setLoading(false);
              }
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
