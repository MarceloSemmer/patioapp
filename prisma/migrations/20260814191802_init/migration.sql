-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'GESTOR', 'FINANCEIRO', 'OPERACIONAL', 'CONSULTA', 'LOCATARIO');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('PLANEJAMENTO', 'ATIVO', 'PARCIALMENTE_ATIVO', 'INATIVO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "SectorType" AS ENUM ('BLOCO', 'ALA', 'PISO', 'CORREDOR', 'SETOR', 'PRACA_ALIMENTACAO', 'AREA_EXTERNA');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('SALA', 'LOJA', 'QUIOSQUE', 'BOX', 'ESPACO_TEMPORARIO', 'AREA_EVENTO', 'VAGA', 'DEPOSITO', 'OUTRO');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('DISPONIVEL', 'EM_NEGOCIACAO', 'RESERVADA', 'OCUPADA', 'EM_CARENCIA', 'EM_REFORMA', 'EM_MANUTENCAO', 'BLOQUEADA', 'INATIVA');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ATIVO', 'INATIVO', 'PROSPECTO', 'INADIMPLENTE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('ABERTO', 'GANHO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_NEGOCIACAO', 'APROVADA', 'RECUSADA', 'EXPIRADA', 'CONVERTIDA');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('LOCACAO_PADRAO', 'LOCACAO_TEMPORARIA', 'QUIOSQUE_EVENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('MINUTA', 'EM_ASSINATURA', 'ATIVO', 'EM_CARENCIA', 'PROXIMO_VENCIMENTO', 'RENOVACAO', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "GuaranteeType" AS ENUM ('CAUCAO', 'FIADOR', 'SEGURO_FIANCA', 'TITULO_CAPITALIZACAO', 'SEM_GARANTIA');

-- CreateEnum
CREATE TYPE "AdjustmentIndexType" AS ENUM ('IPCA', 'IGPM', 'INPC', 'PERCENTUAL_FIXO');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('ALUGUEL', 'CONDOMINIO', 'IPTU', 'FUNDO_PROMOCAO', 'AGUA', 'ENERGIA', 'GAS', 'MULTA', 'JUROS', 'CORRECAO', 'OUTRAS_TAXAS');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PREVISTA', 'EMITIDA', 'PENDENTE', 'PARCIALMENTE_PAGA', 'PAGA', 'VENCIDA', 'RENEGOCIADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'BOLETO', 'TRANSFERENCIA', 'CARTAO', 'DINHEIRO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ELETRICA', 'HIDRAULICA', 'ESTRUTURAL', 'LIMPEZA', 'SEGURANCA', 'CLIMATIZACAO', 'OUTROS');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ABERTO', 'EM_ANALISE', 'AGUARDANDO_APROVACAO', 'AGUARDANDO_MATERIAL', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('ENTRADA', 'ENTREGA_CHAVES', 'PERIODICA', 'SAIDA', 'SEGURANCA', 'MANUTENCAO_PREVENTIVA');

-- CreateEnum
CREATE TYPE "InspectionItemAnswer" AS ENUM ('CONFORME', 'NAO_CONFORME', 'NAO_SE_APLICA');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRATO', 'ADITIVO', 'PROPOSTA', 'RG', 'CPF', 'CONTRATO_SOCIAL', 'ALVARA', 'SEGURO', 'LAUDO', 'PLANTA', 'REGULAMENTO', 'COMPROVANTE', 'VISTORIA', 'OUTROS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONTRATO_VENCENDO', 'REAJUSTE_PROXIMO', 'PROPOSTA_VENCENDO', 'COBRANCA_VENCIDA', 'DOCUMENTO_VENCENDO', 'CHAMADO_ATRASADO', 'ATIVIDADE_ATRASADA', 'UNIDADE_OCIOSA', 'GERAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGIN_FALHOU', 'CRIACAO', 'ALTERACAO', 'EXCLUSAO_LOGICA', 'ALTERACAO_STATUS', 'APROVACAO', 'CANCELAMENTO', 'BAIXA_FINANCEIRA', 'ESTORNO', 'REAJUSTE', 'DOWNLOAD_DOCUMENTO', 'ALTERACAO_PERMISSOES');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#1e3a8a',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "ownersModuleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractAlertDays" INTEGER[] DEFAULT ARRAY[180, 120, 90, 60, 30]::INTEGER[],
    "unitTypesEnabled" TEXT[] DEFAULT ARRAY['SALA', 'LOJA', 'QUIOSQUE', 'BOX', 'ESPACO_TEMPORARIO', 'AREA_EVENTO', 'VAGA', 'DEPOSITO', 'OUTRO']::TEXT[],
    "contractNumberPrefix" TEXT NOT NULL DEFAULT 'CT',
    "proposalNumberPrefix" TEXT NOT NULL DEFAULT 'PR',
    "ticketNumberPrefix" TEXT NOT NULL DEFAULT 'CH',
    "notifyEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_properties" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "cnpj" TEXT,
    "municipalRegistry" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "totalArea" DECIMAL(12,2) NOT NULL,
    "builtArea" DECIMAL(12,2),
    "leasableArea" DECIMAL(12,2) NOT NULL,
    "parkingSpaces" INTEGER DEFAULT 0,
    "openingHours" TEXT,
    "responsibleName" TEXT,
    "description" TEXT,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "internalRules" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'PLANEJAMENTO',
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SectorType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "area" DECIMAL(12,2),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sectorId" TEXT,
    "code" TEXT NOT NULL,
    "commercialName" TEXT,
    "type" "UnitType" NOT NULL,
    "privateArea" DECIMAL(12,2) NOT NULL,
    "commonArea" DECIMAL(12,2),
    "totalArea" DECIMAL(12,2) NOT NULL,
    "frontageWidth" DECIMAL(8,2),
    "ceilingHeight" DECIMAL(8,2),
    "capacity" INTEGER,
    "parkingSpaces" INTEGER DEFAULT 0,
    "suggestedRentPerSqm" DECIMAL(12,2),
    "suggestedRent" DECIMAL(12,2),
    "condoFee" DECIMAL(12,2),
    "iptuFee" DECIMAL(12,2),
    "promoFundFee" DECIMAL(12,2),
    "extraFees" DECIMAL(12,2),
    "keyMoney" DECIMAL(12,2),
    "suggestedDeposit" DECIMAL(12,2),
    "availableFrom" TIMESTAMP(3),
    "allowedSegments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "disallowedSegments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasElectrical" BOOLEAN NOT NULL DEFAULT true,
    "hasWater" BOOLEAN NOT NULL DEFAULT true,
    "hasGas" BOOLEAN NOT NULL DEFAULT false,
    "hasExhaustion" BOOLEAN NOT NULL DEFAULT false,
    "hasInternet" BOOLEAN NOT NULL DEFAULT true,
    "hasAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "hasBathroom" BOOLEAN NOT NULL DEFAULT false,
    "technicalNotes" TEXT,
    "mainImageUrl" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_images" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_status_history" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "previousStatus" "UnitStatus",
    "newStatus" "UnitStatus" NOT NULL,
    "reason" TEXT,
    "changedByUserId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plans" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1600,
    "height" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plan_areas" (
    "id" TEXT NOT NULL,
    "floorPlanId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "x" DECIMAL(6,2) NOT NULL,
    "y" DECIMAL(6,2) NOT NULL,
    "width" DECIMAL(6,2) NOT NULL,
    "height" DECIMAL(6,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_plan_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "pixKey" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_units" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "transferPercent" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT NOT NULL,
    "stateRegistration" TEXT,
    "segment" TEXT,
    "brand" TEXT,
    "legalResponsible" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "socialMedia" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "billingNotes" TEXT,
    "notes" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ATIVO',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "portalUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_contacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isWon" BOOLEAN NOT NULL DEFAULT false,
    "isLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "tenantId" TEXT,
    "stageId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "companyName" TEXT,
    "source" TEXT,
    "segmentDesired" TEXT,
    "desiredArea" DECIMAL(12,2),
    "budgetMin" DECIMAL(12,2),
    "budgetMax" DECIMAL(12,2),
    "ownerUserId" TEXT,
    "nextActivityAt" TIMESTAMP(3),
    "status" "LeadStatus" NOT NULL DEFAULT 'ABERTO',
    "lossReason" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "totalArea" DECIMAL(12,2) NOT NULL,
    "rentPerSqm" DECIMAL(12,2),
    "rentValue" DECIMAL(12,2) NOT NULL,
    "condoFee" DECIMAL(12,2),
    "iptuFee" DECIMAL(12,2),
    "promoFundFee" DECIMAL(12,2),
    "otherFees" DECIMAL(12,2),
    "gracePeriodDays" INTEGER DEFAULT 0,
    "contractTermMonths" INTEGER NOT NULL DEFAULT 36,
    "adjustmentIndex" "AdjustmentIndexType" NOT NULL DEFAULT 'IGPM',
    "guaranteeType" "GuaranteeType" NOT NULL DEFAULT 'CAUCAO',
    "guaranteeValue" DECIMAL(12,2),
    "validUntil" TIMESTAMP(3) NOT NULL,
    "specialConditions" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'RASCUNHO',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_units" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_versions" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "proposalId" TEXT,
    "type" "ContractType" NOT NULL DEFAULT 'LOCACAO_PADRAO',
    "signedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "keyDeliveryDate" TIMESTAMP(3),
    "initialValue" DECIMAL(12,2) NOT NULL,
    "rentPerSqm" DECIMAL(12,2),
    "dueDay" INTEGER NOT NULL DEFAULT 10,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "firstDueDate" TIMESTAMP(3),
    "adjustmentIndex" "AdjustmentIndexType" NOT NULL DEFAULT 'IGPM',
    "adjustmentPeriodMonths" INTEGER NOT NULL DEFAULT 12,
    "nextAdjustmentDate" TIMESTAMP(3),
    "condoFee" DECIMAL(12,2),
    "iptuFee" DECIMAL(12,2),
    "promoFundFee" DECIMAL(12,2),
    "otherFees" DECIMAL(12,2),
    "guaranteeType" "GuaranteeType" NOT NULL DEFAULT 'CAUCAO',
    "guaranteeValue" DECIMAL(12,2),
    "guarantorName" TEXT,
    "hasSuretyInsurance" BOOLEAN NOT NULL DEFAULT false,
    "penaltyClause" TEXT,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "commercialResponsible" TEXT,
    "notes" TEXT,
    "signedFileUrl" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'MINUTA',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_units" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_addendums" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_addendums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_guarantees" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" "GuaranteeType" NOT NULL,
    "value" DECIMAL(12,2),
    "details" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_guarantees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_adjustments" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "economicIndexId" TEXT,
    "baseDate" TIMESTAMP(3) NOT NULL,
    "previousValue" DECIMAL(12,2) NOT NULL,
    "appliedPercent" DECIMAL(8,4) NOT NULL,
    "newValue" DECIMAL(12,2) NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedByUserId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_indexes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "type" "AdjustmentIndexType" NOT NULL,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "percent" DECIMAL(8,4) NOT NULL,
    "source" TEXT,
    "registeredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "competence" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "documentNumber" TEXT,
    "originalAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fineAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "status" "ChargeStatus" NOT NULL DEFAULT 'PREVISTA',
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_items" (
    "id" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "type" "ChargeType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "charge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "reference" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalReason" TEXT,
    "registeredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_tickets" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "tenantId" TEXT,
    "requestedByUserId" TEXT,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIA',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "vendorName" TEXT,
    "dueDate" TIMESTAMP(3),
    "estimatedCost" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    "status" "TicketStatus" NOT NULL DEFAULT 'ABERTO',
    "resolution" TEXT,
    "ratingScore" INTEGER,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_updates" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "newStatus" "TicketStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "unitId" TEXT,
    "type" "InspectionType" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "performedAt" TIMESTAMP(3),
    "responsibleName" TEXT,
    "signedByTenant" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "answer" "InspectionItemAnswer",
    "notes" TEXT,
    "photoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "tenantId" TEXT,
    "contractId" TEXT,
    "ticketId" TEXT,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileUrl" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "uploadedByUserId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_companyId_key" ON "company_settings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_companies_userId_companyId_key" ON "user_companies"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "user_properties_userId_propertyId_key" ON "user_properties"("userId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "properties_companyId_internalCode_key" ON "properties"("companyId", "internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "units_propertyId_code_key" ON "units"("propertyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "floor_plan_areas_floorPlanId_unitId_key" ON "floor_plan_areas"("floorPlanId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "owner_units_ownerId_unitId_key" ON "owner_units"("ownerId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_portalUserId_key" ON "tenants"("portalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_companyId_document_key" ON "tenants"("companyId", "document");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_propertyId_number_key" ON "proposals"("propertyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_units_proposalId_unitId_key" ON "proposal_units"("proposalId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_versions_proposalId_versionNumber_key" ON "proposal_versions"("proposalId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_proposalId_key" ON "contracts"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_propertyId_number_key" ON "contracts"("propertyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "contract_units_contractId_unitId_key" ON "contract_units"("contractId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "economic_indexes_companyId_type_referenceMonth_key" ON "economic_indexes"("companyId", "type", "referenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_tickets_protocol_key" ON "maintenance_tickets"("protocol");

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_properties" ADD CONSTRAINT "user_properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_properties" ADD CONSTRAINT "user_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_images" ADD CONSTRAINT "unit_images_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_status_history" ADD CONSTRAINT "unit_status_history_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_areas" ADD CONSTRAINT "floor_plan_areas_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "floor_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_areas" ADD CONSTRAINT "floor_plan_areas_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_units" ADD CONSTRAINT "owner_units_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_units" ADD CONSTRAINT "owner_units_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_contacts" ADD CONSTRAINT "tenant_contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_units" ADD CONSTRAINT "proposal_units_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_units" ADD CONSTRAINT "proposal_units_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_units" ADD CONSTRAINT "contract_units_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_units" ADD CONSTRAINT "contract_units_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_guarantees" ADD CONSTRAINT "contract_guarantees_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_adjustments" ADD CONSTRAINT "contract_adjustments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_adjustments" ADD CONSTRAINT "contract_adjustments_economicIndexId_fkey" FOREIGN KEY ("economicIndexId") REFERENCES "economic_indexes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economic_indexes" ADD CONSTRAINT "economic_indexes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_items" ADD CONSTRAINT "charge_items_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_updates" ADD CONSTRAINT "ticket_updates_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "maintenance_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "maintenance_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
