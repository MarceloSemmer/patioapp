"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ReceiptText } from "lucide-react";
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
import { generateChargesForContract } from "@/server/actions/charge-actions";

interface ContractOption {
  id: string;
  number: string;
  tenant: { name: string };
}

export function GenerateChargesDialog({ contracts, contractId }: { contracts: ContractOption[]; contractId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(contractId ?? contracts[0]?.id ?? "");
  const [months, setMonths] = useState("12");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await generateChargesForContract({ contractId: selectedContract, months: Number(months) });
      toast.success(`${result.count} cobrança(s) gerada(s).`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar as cobranças.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <ReceiptText className="h-4 w-4" /> Gerar cobranças
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar cobranças mensais</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!contractId && (
            <div>
              <Label>Contrato</Label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.number} · {c.tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="months">Quantidade de meses</Label>
            <Input id="months" type="number" min={1} max={60} value={months} onChange={(e) => setMonths(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">
              Parcelas já existentes para a mesma competência não são duplicadas.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !selectedContract}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
