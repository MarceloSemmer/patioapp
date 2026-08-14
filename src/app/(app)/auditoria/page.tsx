import { requireSession, companyScope } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Auditoria" };

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Login",
  LOGIN_FALHOU: "Falha de login",
  CRIACAO: "Criação",
  ALTERACAO: "Alteração",
  EXCLUSAO_LOGICA: "Exclusão lógica",
  ALTERACAO_STATUS: "Alteração de status",
  APROVACAO: "Aprovação",
  CANCELAMENTO: "Cancelamento",
  BAIXA_FINANCEIRA: "Baixa financeira",
  ESTORNO: "Estorno",
  REAJUSTE: "Reajuste",
  DOWNLOAD_DOCUMENTO: "Download de documento",
  ALTERACAO_PERMISSOES: "Alteração de permissões",
};

export default async function AuditPage() {
  const session = await requireSession();
  requirePermission(session.user.role, "audit:view");
  const companyIds = companyScope(session);

  const logs = await prisma.auditLog.findMany({
    where: companyIds ? { companyId: { in: companyIds } } : {},
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <PageHeader title="Auditoria" description="Registro somente leitura das ações críticas realizadas no sistema." />
      {logs.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nenhum registro de auditoria" description="As ações críticas aparecerão aqui automaticamente." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell>{log.user?.name ?? "Sistema"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ACTION_LABELS[log.action] ?? log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.entity}
                    {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
