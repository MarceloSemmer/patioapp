"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { addMonths, setDate } from "date-fns";
import { PaymentMethod } from "@prisma/client";

/**
 * Sincroniza cobranças pendentes/emitidas vencidas para o status "VENCIDA".
 * Em produção, isso deve ser executado por um job agendado (cron / Supabase
 * Edge Function agendada), e não a cada requisição. Aqui é chamado sob
 * demanda nas telas financeiras para manter a demonstração coerente sem
 * infraestrutura de agendamento externa.
 */
export async function syncOverdueCharges() {
  await prisma.charge.updateMany({
    where: { status: { in: ["PENDENTE", "EMITIDA"] }, dueDate: { lt: new Date() } },
    data: { status: "VENCIDA" },
  });
}

const generateSchema = z.object({
  contractId: z.string().uuid(),
  months: z.coerce.number().int().min(1).max(60).default(12),
});

export async function generateChargesForContract(input: z.infer<typeof generateSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "finance:manage");
  const data = generateSchema.parse(input);

  const contract = await prisma.contract.findUniqueOrThrow({
    where: { id: data.contractId },
    include: { property: true, charges: { select: { competence: true } } },
  });

  const existingCompetences = new Set(contract.charges.map((c) => c.competence.toISOString().slice(0, 7)));

  const chargesToCreate = [];
  for (let i = 0; i < data.months; i++) {
    const competence = addMonths(contract.startDate, i);
    const key = competence.toISOString().slice(0, 7);
    if (existingCompetences.has(key)) continue;

    const dueDate = setDate(competence, Math.min(contract.dueDay, 28));
    const items = [
      { type: "ALUGUEL" as const, description: "Aluguel", amount: contract.initialValue },
      ...(contract.condoFee ? [{ type: "CONDOMINIO" as const, description: "Condomínio", amount: contract.condoFee }] : []),
      ...(contract.iptuFee ? [{ type: "IPTU" as const, description: "IPTU", amount: contract.iptuFee }] : []),
      ...(contract.promoFundFee ? [{ type: "FUNDO_PROMOCAO" as const, description: "Fundo de promoção", amount: contract.promoFundFee }] : []),
      ...(contract.otherFees ? [{ type: "OUTRAS_TAXAS" as const, description: "Outras taxas", amount: contract.otherFees }] : []),
    ];
    const originalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

    chargesToCreate.push({
      contractId: contract.id,
      competence,
      dueDate,
      originalAmount,
      status: "PENDENTE" as const,
      items,
    });
  }

  const created = await prisma.$transaction(
    chargesToCreate.map((c) =>
      prisma.charge.create({
        data: {
          contractId: c.contractId,
          competence: c.competence,
          dueDate: c.dueDate,
          originalAmount: c.originalAmount,
          status: c.status,
          items: { create: c.items },
        },
      }),
    ),
  );

  await recordAudit({
    companyId: contract.property.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Charge",
    entityId: contract.id,
    newData: { count: created.length, months: data.months },
  });

  revalidatePath("/financeiro");
  return { count: created.length };
}

const paymentSchema = z.object({
  chargeId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  paidAt: z.coerce.date().default(() => new Date()),
  reference: z.string().optional().nullable(),
});

export async function registerChargePayment(input: z.infer<typeof paymentSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "finance:writeoff");
  const data = paymentSchema.parse(input);

  const charge = await prisma.charge.findUniqueOrThrow({
    where: { id: data.chargeId },
    include: { contract: { include: { property: true } } },
  });

  if (charge.status === "CANCELADA") {
    throw new Error("Não é possível registrar pagamento em uma cobrança cancelada.");
  }

  const outstanding = Number(charge.originalAmount) - Number(charge.discountAmount) + Number(charge.fineAmount) + Number(charge.interestAmount) - Number(charge.paidAmount);
  if (data.amount > outstanding + 0.01) {
    throw new Error(`O valor informado (${data.amount.toFixed(2)}) excede o saldo em aberto (${outstanding.toFixed(2)}).`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        amount: data.amount,
        method: data.method,
        paidAt: data.paidAt,
        reference: data.reference,
        registeredByUserId: session.user.id,
        allocations: { create: { chargeId: data.chargeId, amount: data.amount } },
      },
    });

    const newPaidAmount = Number(charge.paidAmount) + data.amount;
    const totalDue = Number(charge.originalAmount) - Number(charge.discountAmount) + Number(charge.fineAmount) + Number(charge.interestAmount);
    const newStatus = newPaidAmount >= totalDue - 0.01 ? "PAGA" : "PARCIALMENTE_PAGA";

    const updatedCharge = await tx.charge.update({
      where: { id: data.chargeId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentDate: newStatus === "PAGA" ? data.paidAt : charge.paymentDate,
        paymentMethod: data.method,
      },
    });

    return { payment, charge: updatedCharge };
  });

  await recordAudit({
    companyId: charge.contract.property.companyId,
    userId: session.user.id,
    action: "BAIXA_FINANCEIRA",
    entity: "Charge",
    entityId: data.chargeId,
    newData: { amount: data.amount, method: data.method },
  });

  revalidatePath("/financeiro");
  return result;
}

export async function cancelCharge(chargeId: string, reason: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "finance:manage");

  const charge = await prisma.charge.findUniqueOrThrow({
    where: { id: chargeId },
    include: { contract: { include: { property: true } } },
  });

  if (Number(charge.paidAmount) > 0) {
    throw new Error("Não é possível cancelar uma cobrança que já possui pagamentos. Estorne os pagamentos primeiro.");
  }

  const updated = await prisma.charge.update({
    where: { id: chargeId },
    data: { status: "CANCELADA", cancelledAt: new Date(), notes: reason },
  });

  await recordAudit({
    companyId: charge.contract.property.companyId,
    userId: session.user.id,
    action: "CANCELAMENTO",
    entity: "Charge",
    entityId: chargeId,
    newData: { reason },
  });

  revalidatePath("/financeiro");
  return updated;
}

export async function getChargePayments(chargeId: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "finance:view");

  const allocations = await prisma.paymentAllocation.findMany({
    where: { chargeId },
    include: { payment: true },
    orderBy: { createdAt: "desc" },
  });

  return allocations.map((a) => ({
    paymentId: a.payment.id,
    amount: Number(a.amount),
    method: a.payment.method,
    paidAt: a.payment.paidAt,
    isReversed: a.payment.isReversed,
    reversalReason: a.payment.reversalReason,
    reference: a.payment.reference,
  }));
}

export async function reversePayment(paymentId: string, reason: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "finance:reverse");

  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { allocations: { include: { charge: { include: { contract: { include: { property: true } } } } } } },
  });

  if (payment.isReversed) {
    throw new Error("Este pagamento já foi estornado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { isReversed: true, reversalReason: reason } });

    for (const allocation of payment.allocations) {
      const charge = allocation.charge;
      const newPaidAmount = Math.max(0, Number(charge.paidAmount) - Number(allocation.amount));
      const newStatus = newPaidAmount <= 0 ? (charge.dueDate < new Date() ? "VENCIDA" : "PENDENTE") : "PARCIALMENTE_PAGA";

      await tx.charge.update({
        where: { id: charge.id },
        data: { paidAmount: newPaidAmount, status: newStatus, paymentDate: newPaidAmount <= 0 ? null : charge.paymentDate },
      });
    }
  });

  const firstCharge = payment.allocations[0]?.charge;
  if (firstCharge) {
    await recordAudit({
      companyId: firstCharge.contract.property.companyId,
      userId: session.user.id,
      action: "ESTORNO",
      entity: "Payment",
      entityId: paymentId,
      newData: { reason },
    });
  }

  revalidatePath("/financeiro");
}
