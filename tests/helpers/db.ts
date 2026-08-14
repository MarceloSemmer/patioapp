import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient();

/**
 * Remove todos os dados das tabelas na ordem correta de dependências.
 * Usado entre suítes de teste para garantir isolamento.
 */
export async function resetDatabase() {
  const tables = [
    "audit_logs",
    "notifications",
    "document_versions",
    "documents",
    "inspection_items",
    "inspections",
    "ticket_updates",
    "maintenance_tickets",
    "payment_allocations",
    "payments",
    "charge_items",
    "charges",
    "contract_adjustments",
    "economic_indexes",
    "contract_guarantees",
    "contract_addendums",
    "contract_units",
    "contracts",
    "proposal_versions",
    "proposal_units",
    "proposals",
    "lead_activities",
    "leads",
    "pipeline_stages",
    "tenant_contacts",
    "tenants",
    "owner_units",
    "owners",
    "floor_plan_areas",
    "floor_plans",
    "unit_status_history",
    "unit_images",
    "units",
    "sectors",
    "property_images",
    "user_properties",
    "properties",
    "user_companies",
    "company_settings",
    "users",
    "companies",
  ];

  await testPrisma.$transaction(tables.map((t) => testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`)));
}
