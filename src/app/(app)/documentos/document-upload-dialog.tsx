"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/upload/file-upload";
import { uploadDocument } from "@/server/actions/document-actions";
import { documentTypeLabels } from "@/lib/labels";

interface CompanyOption {
  id: string;
  name: string;
}
interface PropertyOption {
  id: string;
  name: string;
  companyId: string;
}

export function DocumentUploadDialog({ companies, properties }: { companies: CompanyOption[]; properties: PropertyOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [propertyId, setPropertyId] = useState("");
  const [type, setType] = useState("OUTROS");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const filteredProperties = properties.filter((p) => p.companyId === companyId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl) {
      toast.error("Envie o arquivo antes de salvar.");
      return;
    }
    setSubmitting(true);
    try {
      await uploadDocument({
        companyId,
        propertyId: propertyId || null,
        unitId: null,
        tenantId: null,
        contractId: null,
        type: type as never,
        title: title || fileName,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        fileUrl,
        isPrivate: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      toast.success("Documento enviado.");
      setOpen(false);
      setTitle("");
      setFileUrl("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar o documento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Enviar documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setPropertyId(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Empreendimento (opcional)</Label>
              <Select value={propertyId || "none"} onValueChange={(v) => setPropertyId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {filteredProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Tipo de documento</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Se vazio, usa o nome do arquivo" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="expiresAt">Data de vencimento (opcional)</Label>
              <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Arquivo</Label>
              <div className="mt-1 flex items-center gap-2">
                <FileUpload category="documents" onUploaded={(key, _url, name) => { setFileUrl(key); setFileName(name); }} />
                {fileUrl && <span className="text-xs text-muted-foreground">{fileName} ✓</span>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
