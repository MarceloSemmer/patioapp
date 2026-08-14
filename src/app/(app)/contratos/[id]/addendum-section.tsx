"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/upload/file-upload";
import { addContractAddendum } from "@/server/actions/contract-actions";
import { formatDate } from "@/lib/format";

interface Addendum {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  effectiveDate: Date;
}

export function AddendumSection({ contractId, addendums, canManage }: { contractId: string; addendums: Addendum[]; canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addContractAddendum({
        contractId,
        title,
        description: description || null,
        fileUrl: fileUrl || null,
        effectiveDate: new Date(effectiveDate),
      });
      toast.success("Aditivo registrado.");
      setOpen(false);
      setTitle("");
      setDescription("");
      setFileUrl("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar o aditivo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Aditivos contratuais</h3>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" /> Novo aditivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo aditivo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="effectiveDate">Data de vigência</Label>
                  <Input id="effectiveDate" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Documento do aditivo</Label>
                  <div className="mt-1">
                    <FileUpload category="contracts" onUploaded={(url) => setFileUrl(url)} />
                    {fileUrl && <span className="ml-2 text-xs text-muted-foreground">Enviado ✓</span>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Registrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {addendums.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum aditivo registrado.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {addendums.map((a) => (
            <li key={a.id} className="border-b pb-2 last:border-0">
              <p className="font-medium">
                {a.title} <span className="font-normal text-muted-foreground">· {formatDate(a.effectiveDate)}</span>
              </p>
              {a.description && <p className="text-muted-foreground">{a.description}</p>}
              {a.fileUrl && (
                <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Ver documento
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
