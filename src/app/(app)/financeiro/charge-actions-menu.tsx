"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerChargePayment, cancelCharge, getChargePayments, reversePayment } from "@/server/actions/charge-actions";
import { paymentMethodLabels } from "@/lib/labels";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface ChargeLite {
  id: string;
  status: string;
  originalAmount: number;
  paidAmount: number;
}

interface PaymentEntry {
  paymentId: string;
  amount: number;
  method: string;
  paidAt: Date;
  isReversed: boolean;
  reversalReason: string | null;
  reference: string | null;
}

export function ChargeActions({ charge, canWriteOff, canManage }: { charge: ChargeLite; canWriteOff: boolean; canManage: boolean }) {
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [amount, setAmount] = useState(String((charge.originalAmount - charge.paidAmount).toFixed(2)));
  const [method, setMethod] = useState("PIX");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const outstanding = charge.originalAmount - charge.paidAmount;
  const canPay = canWriteOff && outstanding > 0 && charge.status !== "CANCELADA";
  const canCancel = canManage && charge.paidAmount === 0 && charge.status !== "CANCELADA";
  const canViewPayments = charge.paidAmount > 0;

  async function openPayments() {
    const data = await getChargePayments(charge.id);
    setPayments(data);
    setPaymentsOpen(true);
  }

  async function handleReverse(paymentId: string) {
    const motivo = prompt("Motivo do estorno:");
    if (!motivo) return;
    try {
      await reversePayment(paymentId, motivo);
      toast.success("Pagamento estornado.");
      setPaymentsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível estornar o pagamento.");
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerChargePayment({ chargeId: charge.id, amount: Number(amount), method: method as never, paidAt: new Date(), reference: reference || null });
      toast.success("Pagamento registrado.");
      setPayOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar o pagamento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await cancelCharge(charge.id, reason);
      toast.success("Cobrança cancelada.");
      setCancelOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cancelar a cobrança.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canPay && !canCancel && !canViewPayments) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ações da cobrança">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canPay && <DropdownMenuItem onClick={() => setPayOpen(true)}>Registrar pagamento</DropdownMenuItem>}
          {canViewPayments && <DropdownMenuItem onClick={openPayments}>Ver pagamentos / estornar</DropdownMenuItem>}
          {canCancel && (
            <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-destructive focus:text-destructive">
              Cancelar cobrança
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={paymentsOpen} onOpenChange={setPaymentsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamentos da cobrança</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
            ) : (
              payments.map((p) => (
                <div key={p.paymentId} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {formatCurrency(p.amount)} · {paymentMethodLabels[p.method]}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(p.paidAt)}</p>
                    {p.isReversed && <p className="text-xs text-destructive">Estornado: {p.reversalReason}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/api/financeiro/recibo/${p.paymentId}/pdf`} target="_blank" rel="noopener noreferrer">
                        Recibo
                      </a>
                    </Button>
                    {!p.isReversed && canManage && (
                      <Button variant="outline" size="sm" onClick={() => handleReverse(p.paymentId)}>
                        Estornar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-3">
            <p className="text-sm text-muted-foreground">Saldo em aberto: {formatCurrency(outstanding)}</p>
            <div>
              <Label htmlFor="amount">Valor recebido (R$)</Label>
              <Input id="amount" type="number" step="0.01" max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <p className="mt-1 text-xs text-muted-foreground">
                Informe um valor menor que o saldo para registrar uma baixa parcial.
              </p>
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reference">Referência / comprovante</Label>
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar pagamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cobrança</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCancel} className="space-y-3">
            <div>
              <Label htmlFor="reason">Motivo do cancelamento</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
                Voltar
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar cancelamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
