import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Garante que o usuário autenticado é um locatário com perfil vinculado e
 * retorna esse locatário. Todas as consultas do portal devem partir daqui —
 * nunca aceitar um tenantId vindo de parâmetros de URL — para impedir que um
 * locatário acesse dados de outro locatário ou de outra empresa.
 */
export async function requireTenantContext() {
  const session = await requireSession();
  if (session.user.role !== "LOCATARIO" || !session.user.tenantId) {
    redirect("/403");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });

  if (!tenant || tenant.deletedAt) {
    redirect("/403");
  }

  return { session, tenant };
}
