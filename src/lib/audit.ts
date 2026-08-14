import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

interface AuditParams {
  companyId?: string | null;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  previousData?: unknown;
  newData?: unknown;
}

export async function recordAudit(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      companyId: params.companyId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      previousData: params.previousData ? JSON.parse(JSON.stringify(params.previousData)) : undefined,
      newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
    },
  });
}
