import { PrismaClient, UnitStatus, UnitType, SectorType, LeadStatus, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addMonths, subDays, subMonths, startOfMonth, setDate } from "date-fns";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@123";

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seed: iniciando…");

  // ---------------------------------------------------------------------
  // Empresa administradora + configurações
  // ---------------------------------------------------------------------
  const company = await prisma.company.create({
    data: {
      name: "Grupo Demonstração Administração de Imóveis Ltda.",
      tradeName: "Grupo Demonstração",
      cnpj: "12345678000199",
      email: "contato@grupodemonstracao.com.br",
      phone: "(34) 3210-0000",
      whatsapp: "34999990000",
      isDemo: true,
      settings: { create: {} },
    },
  });

  const pipelineStagesData = [
    { name: "Novo contato", order: 1 },
    { name: "Qualificação", order: 2 },
    { name: "Visita agendada", order: 3 },
    { name: "Visita realizada", order: 4 },
    { name: "Proposta em elaboração", order: 5 },
    { name: "Proposta enviada", order: 6 },
    { name: "Em negociação", order: 7 },
    { name: "Documentação", order: 8 },
    { name: "Aprovada", order: 9 },
    { name: "Convertida em contrato", order: 10, isFinal: true, isWon: true },
    { name: "Perdida", order: 11, isFinal: true, isLost: true },
  ];
  const stages: Awaited<ReturnType<typeof prisma.pipelineStage.create>>[] = [];
  for (const s of pipelineStagesData) {
    stages.push(await prisma.pipelineStage.create({ data: { companyId: company.id, ...s } }));
  }
  const stageByName = (name: string) => stages.find((s) => s.name === name)!;

  // ---------------------------------------------------------------------
  // Usuários de demonstração
  // ---------------------------------------------------------------------
  const passwordHash = await hash(DEMO_PASSWORD);

  const superadmin = await prisma.user.create({
    data: { name: "Ana Superadministradora", email: "superadmin@patiogestor.demo", passwordHash, role: "SUPERADMIN", isDemo: true },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Bruno Administrador",
      email: "admin@patiogestor.demo",
      passwordHash,
      role: "ADMIN",
      isDemo: true,
      companies: { create: { companyId: company.id } },
    },
  });
  const financeiro = await prisma.user.create({
    data: {
      name: "Carla Financeiro",
      email: "financeiro@patiogestor.demo",
      passwordHash,
      role: "FINANCEIRO",
      isDemo: true,
      companies: { create: { companyId: company.id } },
    },
  });
  const operacional = await prisma.user.create({
    data: {
      name: "Diego Operacional",
      email: "operacional@patiogestor.demo",
      passwordHash,
      role: "OPERACIONAL",
      isDemo: true,
      companies: { create: { companyId: company.id } },
    },
  });
  const consulta = await prisma.user.create({
    data: {
      name: "Elaine Consulta",
      email: "consulta@patiogestor.demo",
      passwordHash,
      role: "CONSULTA",
      isDemo: true,
      companies: { create: { companyId: company.id } },
    },
  });

  console.log("Seed: usuários base criados.");

  // ---------------------------------------------------------------------
  // Empreendimentos
  // ---------------------------------------------------------------------
  const patioTijuco = await prisma.property.create({
    data: {
      companyId: company.id,
      name: "Pátio Tijuco",
      internalCode: "PT-TIJUCO",
      cnpj: "12345678000280",
      phone: "(34) 3210-1000",
      email: "contato@patiotijuco.com.br",
      whatsapp: "34999991000",
      zipCode: "38400-100",
      street: "Avenida Rondon Pacheco",
      number: "3500",
      neighborhood: "Tibery",
      city: "Uberlândia",
      state: "MG",
      totalArea: 8500,
      builtArea: 6200,
      leasableArea: 5400,
      parkingSpaces: 320,
      openingHours: "Segunda a sábado, das 9h às 22h",
      responsibleName: "Bruno Administrador",
      description: "Street mall a céu aberto com lojas âncora, quiosques e praça de alimentação.",
      amenities: ["Estacionamento coberto", "Praça de alimentação", "Playground", "Wi-Fi gratuito"],
      internalRules: "Horário de carga e descarga: 6h às 9h. Proibido uso de som externo após 21h.",
      status: "ATIVO",
      isDemo: true,
    },
  });

  const patioOxford = await prisma.property.create({
    data: {
      companyId: company.id,
      name: "Pátio Oxford",
      internalCode: "PT-OXFORD",
      cnpj: "12345678000361",
      phone: "(34) 3210-2000",
      email: "contato@patiooxford.com.br",
      whatsapp: "34999992000",
      zipCode: "38408-200",
      street: "Avenida João Naves de Ávila",
      number: "1200",
      neighborhood: "Santa Mônica",
      city: "Uberlândia",
      state: "MG",
      totalArea: 6200,
      builtArea: 4100,
      leasableArea: 3600,
      parkingSpaces: 180,
      openingHours: "Segunda a sábado, das 10h às 22h; domingo, das 12h às 20h",
      responsibleName: "Bruno Administrador",
      description: "Pátio comercial de médio porte, próximo à região universitária.",
      amenities: ["Estacionamento", "Praça de alimentação", "Área pet-friendly"],
      status: "PARCIALMENTE_ATIVO",
      isDemo: true,
    },
  });

  console.log("Seed: empreendimentos criados.");

  // ---------------------------------------------------------------------
  // Setores
  // ---------------------------------------------------------------------
  const sectorsData = [
    { propertyId: patioTijuco.id, name: "Térreo — Alameda Principal", type: SectorType.SETOR, order: 1, area: 2400 },
    { propertyId: patioTijuco.id, name: "Piso Superior", type: SectorType.PISO, order: 2, area: 1800 },
    { propertyId: patioTijuco.id, name: "Praça de Alimentação", type: SectorType.PRACA_ALIMENTACAO, order: 3, area: 900 },
    { propertyId: patioOxford.id, name: "Bloco A", type: SectorType.BLOCO, order: 1, area: 2000 },
    { propertyId: patioOxford.id, name: "Bloco B", type: SectorType.BLOCO, order: 2, area: 1200 },
  ];
  const sectors = [];
  for (const s of sectorsData) sectors.push(await prisma.sector.create({ data: s }));

  console.log("Seed: setores criados.");

  // ---------------------------------------------------------------------
  // Unidades
  // ---------------------------------------------------------------------
  interface UnitSeed {
    propertyId: string;
    sectorId: string;
    code: string;
    commercialName?: string;
    type: UnitType;
    privateArea: number;
    status: UnitStatus;
  }

  const unitsSeed: UnitSeed[] = [
    { propertyId: patioTijuco.id, sectorId: sectors[0].id, code: "L-101", commercialName: "Café Aroma", type: "LOJA", privateArea: 65, status: "OCUPADA" },
    { propertyId: patioTijuco.id, sectorId: sectors[0].id, code: "L-102", commercialName: "Moda Urbana", type: "LOJA", privateArea: 80, status: "OCUPADA" },
    { propertyId: patioTijuco.id, sectorId: sectors[0].id, code: "L-103", type: "LOJA", privateArea: 55, status: "DISPONIVEL" },
    { propertyId: patioTijuco.id, sectorId: sectors[0].id, code: "L-104", commercialName: "Farmácia Vida", type: "LOJA", privateArea: 120, status: "OCUPADA" },
    { propertyId: patioTijuco.id, sectorId: sectors[0].id, code: "L-105", type: "LOJA", privateArea: 60, status: "EM_NEGOCIACAO" },
    { propertyId: patioTijuco.id, sectorId: sectors[0].id, code: "K-01", commercialName: "Sucos & Cia", type: "QUIOSQUE", privateArea: 12, status: "OCUPADA" },
    { propertyId: patioTijuco.id, sectorId: sectors[0].id, code: "K-02", type: "QUIOSQUE", privateArea: 12, status: "DISPONIVEL" },
    { propertyId: patioTijuco.id, sectorId: sectors[1].id, code: "S-201", commercialName: "Escritório Contábil Fontes", type: "SALA", privateArea: 45, status: "OCUPADA" },
    { propertyId: patioTijuco.id, sectorId: sectors[1].id, code: "S-202", type: "SALA", privateArea: 40, status: "RESERVADA" },
    { propertyId: patioTijuco.id, sectorId: sectors[1].id, code: "S-203", type: "SALA", privateArea: 38, status: "EM_MANUTENCAO" },
    { propertyId: patioTijuco.id, sectorId: sectors[1].id, code: "S-204", type: "SALA", privateArea: 42, status: "DISPONIVEL" },
    { propertyId: patioTijuco.id, sectorId: sectors[2].id, code: "PA-01", commercialName: "Pastelaria Dona Rosa", type: "BOX", privateArea: 20, status: "OCUPADA" },
    { propertyId: patioTijuco.id, sectorId: sectors[2].id, code: "PA-02", type: "BOX", privateArea: 20, status: "DISPONIVEL" },
    { propertyId: patioTijuco.id, sectorId: sectors[2].id, code: "PA-03", type: "BOX", privateArea: 18, status: "BLOQUEADA" },
    { propertyId: patioOxford.id, sectorId: sectors[3].id, code: "A-01", commercialName: "Livraria Página Nova", type: "LOJA", privateArea: 90, status: "OCUPADA" },
    { propertyId: patioOxford.id, sectorId: sectors[3].id, code: "A-02", type: "LOJA", privateArea: 70, status: "OCUPADA" },
    { propertyId: patioOxford.id, sectorId: sectors[3].id, code: "A-03", type: "LOJA", privateArea: 55, status: "DISPONIVEL" },
    { propertyId: patioOxford.id, sectorId: sectors[3].id, code: "A-04", type: "LOJA", privateArea: 60, status: "EM_REFORMA" },
    { propertyId: patioOxford.id, sectorId: sectors[4].id, code: "B-01", commercialName: "Studio Pilates Oxford", type: "SALA", privateArea: 75, status: "OCUPADA" },
    { propertyId: patioOxford.id, sectorId: sectors[4].id, code: "B-02", type: "SALA", privateArea: 30, status: "DISPONIVEL" },
    { propertyId: patioOxford.id, sectorId: sectors[4].id, code: "B-03", type: "DEPOSITO", privateArea: 25, status: "INATIVA" },
    { propertyId: patioOxford.id, sectorId: sectors[4].id, code: "V-01", type: "VAGA", privateArea: 15, status: "DISPONIVEL" },
  ];

  const units: Awaited<ReturnType<typeof prisma.unit.create>>[] = [];
  for (const u of unitsSeed) {
    const totalArea = u.privateArea * 1.12;
    const suggestedRentPerSqm = 55 + Math.random() * 40;
    const unit = await prisma.unit.create({
      data: {
        propertyId: u.propertyId,
        sectorId: u.sectorId,
        code: u.code,
        commercialName: u.commercialName,
        type: u.type,
        privateArea: u.privateArea,
        totalArea,
        commonArea: totalArea - u.privateArea,
        suggestedRentPerSqm,
        suggestedRent: suggestedRentPerSqm * u.privateArea,
        condoFee: u.privateArea * 8,
        iptuFee: u.privateArea * 3,
        promoFundFee: u.privateArea * 2,
        suggestedDeposit: suggestedRentPerSqm * u.privateArea * 3,
        status: u.status,
        hasElectrical: true,
        hasWater: true,
        hasInternet: true,
        hasBathroom: u.type === "LOJA" || u.type === "SALA",
        isDemo: true,
      },
    });
    units.push(unit);

    // Histórico de status: cadastro + eventual transição para o status atual
    await prisma.unitStatusHistory.create({
      data: { unitId: unit.id, newStatus: "DISPONIVEL", reason: "Cadastro inicial da unidade.", changedAt: subMonths(new Date(), 8) },
    });
    if (u.status !== "DISPONIVEL") {
      await prisma.unitStatusHistory.create({
        data: {
          unitId: unit.id,
          previousStatus: "DISPONIVEL",
          newStatus: u.status,
          reason: "Atualização de situação (dado de demonstração).",
          changedAt: subMonths(new Date(), Math.floor(Math.random() * 6) + 1),
        },
      });
    }
  }

  console.log(`Seed: ${units.length} unidades criadas.`);

  const unitByCode = (code: string) => units.find((u) => u.code === code)!;

  // ---------------------------------------------------------------------
  // Planta interativa (Pátio Tijuco)
  // ---------------------------------------------------------------------
  const floorPlan = await prisma.floorPlan.create({
    data: {
      propertyId: patioTijuco.id,
      name: "Planta — Térreo",
      imageUrl: "/uploads/seed/planta-patio-tijuco.svg",
    },
  });
  const floorPlanAreas: { code: string; x: number; y: number; width: number; height: number }[] = [
    { code: "L-101", x: 5, y: 10, width: 12, height: 20 },
    { code: "L-102", x: 19, y: 10, width: 12, height: 20 },
    { code: "L-103", x: 33, y: 10, width: 12, height: 20 },
    { code: "L-104", x: 47, y: 10, width: 15, height: 20 },
    { code: "L-105", x: 64, y: 10, width: 12, height: 20 },
    { code: "K-01", x: 5, y: 40, width: 8, height: 10 },
    { code: "K-02", x: 15, y: 40, width: 8, height: 10 },
    { code: "PA-01", x: 40, y: 60, width: 10, height: 12 },
    { code: "PA-02", x: 52, y: 60, width: 10, height: 12 },
    { code: "PA-03", x: 64, y: 60, width: 10, height: 12 },
  ];
  for (const area of floorPlanAreas) {
    await prisma.floorPlanArea.create({
      data: { floorPlanId: floorPlan.id, unitId: unitByCode(area.code).id, x: area.x, y: area.y, width: area.width, height: area.height },
    });
  }

  console.log("Seed: planta interativa criada.");

  // ---------------------------------------------------------------------
  // Locatários
  // ---------------------------------------------------------------------
  const tenantsSeed = [
    { name: "Café Aroma Comércio de Alimentos Ltda.", tradeName: "Café Aroma", document: "11222333000181", segment: "Alimentação", email: "contato@cafearoma.com.br" },
    { name: "Moda Urbana Confecções Ltda.", tradeName: "Moda Urbana", document: "11222333000262", segment: "Vestuário", email: "financeiro@modaurbana.com.br" },
    { name: "Farmácia Vida S.A.", tradeName: "Farmácia Vida", document: "11222333000343", segment: "Saúde", email: "contato@farmaciavida.com.br" },
    { name: "Sucos & Cia Comércio Ltda.", tradeName: "Sucos & Cia", document: "11222333000424", segment: "Alimentação", email: "sucos@suco.com.br" },
    { name: "Escritório Contábil Fontes Ltda.", tradeName: "Contábil Fontes", document: "11222333000505", segment: "Serviços", email: "contato@fontescontabil.com.br" },
    { name: "Pastelaria Dona Rosa Ltda.", tradeName: "Pastelaria Dona Rosa", document: "11222333000686", segment: "Alimentação", email: "rosa@pastelaria.com.br" },
    { name: "Livraria Página Nova Ltda.", tradeName: "Página Nova", document: "11222333000767", segment: "Varejo", email: "contato@paginanova.com.br" },
    { name: "Studio Pilates Oxford Ltda.", tradeName: "Studio Pilates Oxford", document: "11222333000848", segment: "Bem-estar", email: "contato@pilatesoxford.com.br" },
  ];

  const tenants = [];
  for (const t of tenantsSeed) {
    const tenant = await prisma.tenant.create({
      data: {
        companyId: company.id,
        personType: "JURIDICA",
        name: t.name,
        tradeName: t.tradeName,
        document: t.document,
        segment: t.segment,
        email: t.email,
        phone: "34988880000",
        whatsapp: "34988880000",
        city: "Uberlândia",
        state: "MG",
        status: "ATIVO",
        isDemo: true,
      },
    });
    tenants.push(tenant);
  }

  console.log(`Seed: ${tenants.length} locatários criados.`);

  // Usuário locatário demo — vinculado ao primeiro locatário (Café Aroma)
  const tenantForPortal = tenants[0];
  const locatarioUser = await prisma.user.create({
    data: {
      name: "Fernanda Locatária (Café Aroma)",
      email: "locatario@patiogestor.demo",
      passwordHash,
      role: "LOCATARIO",
      isDemo: true,
      tenantProfile: { connect: { id: tenantForPortal.id } },
    },
  });

  const gestor = await prisma.user.create({
    data: {
      name: "Gustavo Gestor",
      email: "gestor@patiogestor.demo",
      passwordHash,
      role: "GESTOR",
      isDemo: true,
      companies: { create: { companyId: company.id } },
      propertyAccess: { create: { propertyId: patioTijuco.id } },
    },
  });

  console.log("Seed: usuários de perfis finalizados.");

  // ---------------------------------------------------------------------
  // Leads (CRM)
  // ---------------------------------------------------------------------
  const leadsSeed = [
    { contactName: "Marcos Silva", companyName: "Doceria Bom Sabor", stage: "Novo contato", segment: "Alimentação" },
    { contactName: "Patrícia Souza", companyName: "Ótica Enxergar Bem", stage: "Qualificação", segment: "Saúde" },
    { contactName: "Rafael Costa", companyName: "Pet Shop Amigo Fiel", stage: "Visita agendada", segment: "Pet" },
    { contactName: "Camila Rocha", companyName: "Academia Movimento", stage: "Visita realizada", segment: "Bem-estar" },
    { contactName: "Thiago Almeida", companyName: "Barbearia Estilo", stage: "Proposta em elaboração", segment: "Beleza" },
    { contactName: "Juliana Martins", companyName: "Papelaria Criativa", stage: "Proposta enviada", segment: "Varejo" },
    { contactName: "Eduardo Lima", companyName: "Sorveteria Gelato Mix", stage: "Em negociação", segment: "Alimentação" },
    { contactName: "Larissa Pires", companyName: "Clínica Odontológica Sorriso", stage: "Documentação", segment: "Saúde" },
    { contactName: "Vinícius Teixeira", companyName: "Loja de Games Level Up", stage: "Aprovada", segment: "Varejo" },
    { contactName: "Beatriz Nogueira", companyName: "Salão Beleza Pura", stage: "Perdida", segment: "Beleza" },
  ];

  for (const l of leadsSeed) {
    await prisma.lead.create({
      data: {
        propertyId: Math.random() > 0.5 ? patioTijuco.id : patioOxford.id,
        stageId: stageByName(l.stage).id,
        contactName: l.contactName,
        companyName: l.companyName,
        contactPhone: "34987770000",
        contactEmail: `${l.contactName.split(" ")[0].toLowerCase()}@lead.com.br`,
        segmentDesired: l.segment,
        desiredArea: 40 + Math.random() * 60,
        budgetMin: 3000,
        budgetMax: 8000,
        ownerUserId: gestor.id,
        status: l.stage === "Perdida" ? LeadStatus.PERDIDO : l.stage === "Aprovada" ? LeadStatus.ABERTO : LeadStatus.ABERTO,
        lossReason: l.stage === "Perdida" ? "Optou por outro ponto comercial." : null,
        nextActivityAt: l.stage === "Perdida" ? null : addDays(new Date(), Math.floor(Math.random() * 10) + 1),
        isDemo: true,
      },
    });
  }

  console.log(`Seed: ${leadsSeed.length} leads criados.`);

  // ---------------------------------------------------------------------
  // Propostas
  // ---------------------------------------------------------------------
  const availableUnit = unitByCode("L-103");
  const proposalDraft = await prisma.proposal.create({
    data: {
      number: "PR-2026-0001",
      propertyId: patioTijuco.id,
      tenantId: tenants[1].id,
      totalArea: Number(availableUnit.totalArea),
      rentValue: 4200,
      condoFee: 520,
      iptuFee: 195,
      gracePeriodDays: 30,
      contractTermMonths: 36,
      adjustmentIndex: "IGPM",
      guaranteeType: "CAUCAO",
      guaranteeValue: 12600,
      validUntil: addDays(new Date(), 20),
      status: "EM_NEGOCIACAO",
      isDemo: true,
      units: { create: { unitId: availableUnit.id } },
    },
  });
  await prisma.proposalVersion.create({
    data: { proposalId: proposalDraft.id, versionNumber: 1, snapshot: { rentValue: 4200 } },
  });

  const reservedUnit = unitByCode("S-202");
  const proposalApproved = await prisma.proposal.create({
    data: {
      number: "PR-2026-0002",
      propertyId: patioTijuco.id,
      tenantId: tenants[4].id,
      totalArea: Number(reservedUnit.totalArea),
      rentValue: 3100,
      condoFee: 320,
      iptuFee: 120,
      gracePeriodDays: 15,
      contractTermMonths: 24,
      adjustmentIndex: "IPCA",
      guaranteeType: "FIADOR",
      validUntil: addDays(new Date(), 10),
      status: "APROVADA",
      isDemo: true,
      units: { create: { unitId: reservedUnit.id } },
    },
  });
  await prisma.proposalVersion.create({
    data: { proposalId: proposalApproved.id, versionNumber: 1, snapshot: { rentValue: 3100 } },
  });

  console.log("Seed: propostas criadas.");

  // ---------------------------------------------------------------------
  // Contratos + cobranças + pagamentos
  // ---------------------------------------------------------------------
  async function createContractWithCharges(opts: {
    number: string;
    propertyId: string;
    tenantId: string;
    unitCodes: string[];
    startDate: Date;
    endDate: Date;
    initialValue: number;
    condoFee?: number;
    iptuFee?: number;
    status: "ATIVO" | "PROXIMO_VENCIMENTO" | "MINUTA";
    monthsBilled: number;
    payAllButLast?: boolean;
    makeOneOverdue?: boolean;
  }) {
    const contract = await prisma.contract.create({
      data: {
        number: opts.number,
        propertyId: opts.propertyId,
        tenantId: opts.tenantId,
        startDate: opts.startDate,
        endDate: opts.endDate,
        initialValue: opts.initialValue,
        condoFee: opts.condoFee ?? 0,
        iptuFee: opts.iptuFee ?? 0,
        dueDay: 10,
        adjustmentIndex: "IGPM",
        adjustmentPeriodMonths: 12,
        nextAdjustmentDate: addMonths(opts.startDate, 12),
        guaranteeType: "CAUCAO",
        guaranteeValue: opts.initialValue * 3,
        status: opts.status,
        isDemo: true,
        units: { create: opts.unitCodes.map((code) => ({ unitId: unitByCode(code).id })) },
      },
    });

    if (opts.status === "MINUTA") return contract;

    for (let i = 0; i < opts.monthsBilled; i++) {
      const competence = addMonths(startOfMonth(opts.startDate), i);
      const dueDate = setDate(competence, 10);
      const originalAmount = opts.initialValue + (opts.condoFee ?? 0) + (opts.iptuFee ?? 0);
      const isLast = i === opts.monthsBilled - 1;
      const isPast = dueDate < new Date();

      let status: "PAGA" | "PENDENTE" | "VENCIDA" = "PENDENTE";
      if (isPast) status = opts.payAllButLast && isLast ? "PENDENTE" : "PAGA";
      if (opts.makeOneOverdue && isLast) status = "VENCIDA";

      const charge = await prisma.charge.create({
        data: {
          contractId: contract.id,
          competence,
          dueDate,
          originalAmount,
          status,
          paidAmount: status === "PAGA" ? originalAmount : 0,
          paymentDate: status === "PAGA" ? dueDate : null,
          paymentMethod: status === "PAGA" ? "PIX" : null,
          isDemo: true,
          items: {
            create: [
              { type: "ALUGUEL", description: "Aluguel", amount: opts.initialValue },
              ...(opts.condoFee ? [{ type: "CONDOMINIO" as const, description: "Condomínio", amount: opts.condoFee }] : []),
              ...(opts.iptuFee ? [{ type: "IPTU" as const, description: "IPTU", amount: opts.iptuFee }] : []),
            ],
          },
        },
      });

      if (status === "PAGA") {
        await prisma.payment.create({
          data: {
            amount: originalAmount,
            method: "PIX",
            paidAt: dueDate,
            reference: `SEED-${contract.number}-${i}`,
            allocations: { create: { chargeId: charge.id, amount: originalAmount } },
          },
        });
      }
    }

    return contract;
  }

  // Contrato ativo — Café Aroma (locatário do portal), com uma cobrança pendente e histórico de pagamentos
  const contractCafeAroma = await createContractWithCharges({
    number: "CT-2025-0001",
    propertyId: patioTijuco.id,
    tenantId: tenantForPortal.id,
    unitCodes: ["L-101"],
    startDate: subMonths(new Date(), 8),
    endDate: addMonths(new Date(), 28),
    initialValue: 3800,
    condoFee: 480,
    iptuFee: 210,
    status: "ATIVO",
    monthsBilled: 9,
    payAllButLast: true,
  });

  // Contrato ativo — Moda Urbana, com uma cobrança vencida (inadimplência)
  await createContractWithCharges({
    number: "CT-2025-0002",
    propertyId: patioTijuco.id,
    tenantId: tenants[1].id,
    unitCodes: ["L-102"],
    startDate: subMonths(new Date(), 6),
    endDate: addMonths(new Date(), 30),
    initialValue: 4500,
    condoFee: 560,
    iptuFee: 260,
    status: "ATIVO",
    monthsBilled: 7,
    makeOneOverdue: true,
  });

  // Contrato próximo do vencimento — Farmácia Vida
  await createContractWithCharges({
    number: "CT-2023-0003",
    propertyId: patioTijuco.id,
    tenantId: tenants[2].id,
    unitCodes: ["L-104"],
    startDate: subMonths(new Date(), 34),
    endDate: addDays(new Date(), 45),
    initialValue: 7200,
    condoFee: 840,
    iptuFee: 390,
    status: "PROXIMO_VENCIMENTO",
    monthsBilled: 12,
  });

  // Contrato ativo — Sucos & Cia
  await createContractWithCharges({
    number: "CT-2025-0004",
    propertyId: patioTijuco.id,
    tenantId: tenants[3].id,
    unitCodes: ["K-01"],
    startDate: subMonths(new Date(), 4),
    endDate: addMonths(new Date(), 32),
    initialValue: 1400,
    status: "ATIVO",
    monthsBilled: 5,
  });

  // Contrato ativo — Contábil Fontes
  await createContractWithCharges({
    number: "CT-2025-0005",
    propertyId: patioTijuco.id,
    tenantId: tenants[4].id,
    unitCodes: ["S-201"],
    startDate: subMonths(new Date(), 10),
    endDate: addMonths(new Date(), 26),
    initialValue: 2600,
    condoFee: 310,
    status: "ATIVO",
    monthsBilled: 11,
  });

  // Contrato ativo — Pastelaria Dona Rosa
  await createContractWithCharges({
    number: "CT-2025-0006",
    propertyId: patioTijuco.id,
    tenantId: tenants[5].id,
    unitCodes: ["PA-01"],
    startDate: subMonths(new Date(), 3),
    endDate: addMonths(new Date(), 33),
    initialValue: 1900,
    status: "ATIVO",
    monthsBilled: 4,
  });

  // Contrato ativo — Livraria Página Nova (Pátio Oxford)
  await createContractWithCharges({
    number: "CT-2025-0001",
    propertyId: patioOxford.id,
    tenantId: tenants[6].id,
    unitCodes: ["A-01"],
    startDate: subMonths(new Date(), 12),
    endDate: addMonths(new Date(), 24),
    initialValue: 5200,
    condoFee: 610,
    iptuFee: 280,
    status: "ATIVO",
    monthsBilled: 13,
  });

  // Contrato ativo — Studio Pilates Oxford
  await createContractWithCharges({
    number: "CT-2025-0002",
    propertyId: patioOxford.id,
    tenantId: tenants[7].id,
    unitCodes: ["B-01"],
    startDate: subMonths(new Date(), 5),
    endDate: addMonths(new Date(), 31),
    initialValue: 3300,
    status: "ATIVO",
    monthsBilled: 6,
  });

  // Contrato ativo — Livraria Página Nova unidade adicional A-02 vinculada a outro locatário fictício
  await createContractWithCharges({
    number: "CT-2025-0003",
    propertyId: patioOxford.id,
    tenantId: tenants[6].id,
    unitCodes: ["A-02"],
    startDate: subMonths(new Date(), 2),
    endDate: addMonths(new Date(), 34),
    initialValue: 3900,
    status: "ATIVO",
    monthsBilled: 3,
  });

  // Contrato em minuta (ainda não ativo) — não deve ocupar a unidade
  await createContractWithCharges({
    number: "CT-2026-0007",
    propertyId: patioTijuco.id,
    tenantId: tenants[1].id,
    unitCodes: ["S-204"],
    startDate: addDays(new Date(), 15),
    endDate: addMonths(addDays(new Date(), 15), 36),
    initialValue: 2100,
    status: "MINUTA",
    monthsBilled: 0,
  });

  console.log("Seed: contratos e cobranças criados.");

  // ---------------------------------------------------------------------
  // Chamados de manutenção
  // ---------------------------------------------------------------------
  const ticketsSeed: { code: string; title: string; status: TicketStatus; category: "ELETRICA" | "HIDRAULICA" | "LIMPEZA" | "CLIMATIZACAO" | "SEGURANCA" }[] = [
    { code: "L-101", title: "Lâmpada da vitrine queimada", status: "ABERTO", category: "ELETRICA" },
    { code: "L-102", title: "Vazamento no banheiro", status: "EM_EXECUCAO", category: "HIDRAULICA" },
    { code: "S-201", title: "Ar-condicionado sem gelar", status: "AGUARDANDO_MATERIAL", category: "CLIMATIZACAO" },
    { code: "PA-01", title: "Limpeza da área externa", status: "CONCLUIDO", category: "LIMPEZA" },
    { code: "A-01", title: "Câmera de segurança com defeito", status: "EM_ANALISE", category: "SEGURANCA" },
  ];

  for (const t of ticketsSeed) {
    const unit = unitByCode(t.code);
    const protocol = `CH-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    await prisma.maintenanceTicket.create({
      data: {
        protocol,
        propertyId: unit.propertyId,
        unitId: unit.id,
        requestedByUserId: operacional.id,
        category: t.category,
        priority: "MEDIA",
        title: t.title,
        description: `${t.title} — chamado de demonstração.`,
        status: t.status,
        assignedToUserId: t.status !== "ABERTO" ? operacional.id : null,
        dueDate: addDays(new Date(), 5),
        closedAt: t.status === "CONCLUIDO" ? subDays(new Date(), 2) : null,
        isDemo: true,
      },
    });
  }

  console.log(`Seed: ${ticketsSeed.length} chamados de manutenção criados.`);

  // ---------------------------------------------------------------------
  // Vistorias
  // ---------------------------------------------------------------------
  await prisma.inspection.create({
    data: {
      contractId: contractCafeAroma.id,
      type: "ENTRADA",
      performedAt: contractCafeAroma.startDate,
      responsibleName: "Equipe de gestão — Pátio Tijuco",
      signedByTenant: true,
      notes: "Vistoria de entrada sem ressalvas relevantes.",
      items: {
        create: [
          { label: "Pisos sem trincas ou manchas", answer: "CONFORME", order: 0 },
          { label: "Paredes e pintura em bom estado", answer: "CONFORME", order: 1 },
          { label: "Portas e fechaduras funcionando", answer: "CONFORME", order: 2 },
          { label: "Instalações elétricas (tomadas, interruptores, quadro)", answer: "CONFORME", order: 3 },
          { label: "Instalações hidráulicas (registros, torneiras, ralos)", answer: "NAO_CONFORME", notes: "Pequeno vazamento no registro da pia — encaminhado à manutenção.", order: 4 },
          { label: "Vidros e esquadrias íntegros", answer: "CONFORME", order: 5 },
          { label: "Limpeza geral do imóvel", answer: "CONFORME", order: 6 },
        ],
      },
    },
  });

  const periodicUnit = unitByCode("A-01");
  await prisma.inspection.create({
    data: {
      unitId: periodicUnit.id,
      type: "PERIODICA",
      scheduledAt: addDays(new Date(), 7),
      items: {
        create: [
          { label: "Conservação geral da unidade", order: 0 },
          { label: "Sinais de infiltração ou umidade", order: 1 },
          { label: "Instalações elétricas e hidráulicas em funcionamento", order: 2 },
          { label: "Cumprimento do uso previsto em contrato", order: 3 },
        ],
      },
    },
  });

  console.log("Seed: vistorias criadas.");

  // ---------------------------------------------------------------------
  // Documentos
  // ---------------------------------------------------------------------
  await prisma.document.create({
    data: {
      companyId: company.id,
      propertyId: patioTijuco.id,
      tenantId: tenantForPortal.id,
      type: "CONTRATO_SOCIAL",
      title: "Contrato social — Café Aroma",
      fileUrl: "/uploads/seed/contrato-social-exemplo.pdf",
      isPrivate: true,
      uploadedByUserId: admin.id,
      isDemo: true,
    },
  });
  await prisma.document.create({
    data: {
      companyId: company.id,
      propertyId: patioTijuco.id,
      type: "ALVARA",
      title: "Alvará de funcionamento — Pátio Tijuco",
      fileUrl: "/uploads/seed/alvara-exemplo.pdf",
      isPrivate: true,
      expiresAt: addDays(new Date(), 20),
      uploadedByUserId: admin.id,
      isDemo: true,
    },
  });

  console.log("Seed: documentos criados.");

  // ---------------------------------------------------------------------
  // Índices econômicos (registro manual, nunca inventado em produção)
  // ---------------------------------------------------------------------
  await prisma.economicIndex.create({
    data: {
      companyId: company.id,
      type: "IGPM",
      referenceMonth: startOfMonth(subMonths(new Date(), 1)),
      percent: 0.42,
      source: "Dado de demonstração — substituir por fonte oficial (FGV) em produção.",
    },
  });
  await prisma.economicIndex.create({
    data: {
      companyId: company.id,
      type: "IPCA",
      referenceMonth: startOfMonth(subMonths(new Date(), 1)),
      percent: 0.31,
      source: "Dado de demonstração — substituir por fonte oficial (IBGE) em produção.",
    },
  });

  // ---------------------------------------------------------------------
  // Notificações
  // ---------------------------------------------------------------------
  await prisma.notification.create({
    data: {
      companyId: company.id,
      userId: admin.id,
      type: "GERAL",
      title: "Ambiente de demonstração",
      message: "Este ambiente contém dados fictícios para fins de demonstração do PátioGestor.",
      isDemo: true,
    },
  });

  console.log("Seed: concluído com sucesso.");
  console.log("");
  console.log("Usuários de demonstração (senha para todos: Demo@123):");
  console.log(` - Superadministrador: ${superadmin.email}`);
  console.log(` - Administrador:      ${admin.email}`);
  console.log(` - Gestor:              ${gestor.email}`);
  console.log(` - Financeiro:          ${financeiro.email}`);
  console.log(` - Operacional:         ${operacional.email}`);
  console.log(` - Consulta:            ${consulta.email}`);
  console.log(` - Locatário:           ${locatarioUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
