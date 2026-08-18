"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { completeInspection } from "@/server/actions/inspection-actions";

export function CompleteInspectionDialog({
  inspectionId,
  defaultResponsibleName,
  defaultNotes,
}: {
  inspectionId: string;
  defaultResponsibleName: string;
  defaultNotes: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [responsibleName, setResponsibleName] = useState(defaultResponsibleName);
  const [signedByTenant, setSignedByTenant] = useState(false);
  const [notes, setNotes] = useState(defaultNotes);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await completeInspection({
        inspectionId,
        performedAt: new Date(performedAt),
        responsibleName: responsibleName || null,
        signedByTenant,
        notes: notes || null,
      });
      toast.success("Vistoria concluída.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir a vistoria.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CheckCircle2 className="h-4 w-4" /> Concluir vistoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir vistoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="performedAt">Data da realização</Label>
              <Input id="performedAt" type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="responsibleName">Responsável</Label>
              <Input id="responsibleName" value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="signedByTenant" checked={signedByTenant} onCheckedChange={(v) => setSignedByTenant(v === true)} />
            <Label htmlFor="signedByTenant" className="font-normal">
              Laudo assinado pelo locatário
            </Label>
          </div>
          <div>
            <Label htmlFor="notes">Observações gerais</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar conclusão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
