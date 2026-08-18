export const propertyStatusLabels: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  ATIVO: "Ativo",
  PARCIALMENTE_ATIVO: "Parcialmente ativo",
  INATIVO: "Inativo",
  VENDIDO: "Vendido",
};

export const propertyStatusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  PLANEJAMENTO: "outline",
  ATIVO: "success",
  PARCIALMENTE_ATIVO: "warning",
  INATIVO: "secondary",
  VENDIDO: "secondary",
};

export const sectorTypeLabels: Record<string, string> = {
  BLOCO: "Bloco",
  ALA: "Ala",
  PISO: "Piso",
  CORREDOR: "Corredor",
  SETOR: "Setor",
  PRACA_ALIMENTACAO: "Praça de alimentação",
  AREA_EXTERNA: "Área externa",
};

export const unitTypeLabels: Record<string, string> = {
  SALA: "Sala",
  LOJA: "Loja",
  QUIOSQUE: "Quiosque",
  BOX: "Box",
  ESPACO_TEMPORARIO: "Espaço temporário",
  AREA_EVENTO: "Área para eventos",
  VAGA: "Vaga",
  DEPOSITO: "Depósito",
  OUTRO: "Outro",
};

export const unitStatusLabels: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_NEGOCIACAO: "Em negociação",
  RESERVADA: "Reservada",
  OCUPADA: "Ocupada",
  EM_CARENCIA: "Em carência",
  EM_REFORMA: "Em reforma",
  EM_MANUTENCAO: "Em manutenção",
  BLOQUEADA: "Bloqueada",
  INATIVA: "Inativa",
};

export const unitStatusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  DISPONIVEL: "success",
  EM_NEGOCIACAO: "warning",
  RESERVADA: "default",
  OCUPADA: "destructive",
  EM_CARENCIA: "warning",
  EM_REFORMA: "secondary",
  EM_MANUTENCAO: "secondary",
  BLOQUEADA: "secondary",
  INATIVA: "outline",
};

// Cores para a planta interativa (requisito do módulo 5)
export const unitStatusPlanColors: Record<string, string> = {
  DISPONIVEL: "#16a34a", // verde
  EM_NEGOCIACAO: "#eab308", // amarelo
  RESERVADA: "#2563eb", // azul
  OCUPADA: "#dc2626", // vermelho
  EM_CARENCIA: "#dc2626",
  EM_REFORMA: "#6b7280", // cinza
  EM_MANUTENCAO: "#6b7280",
  BLOQUEADA: "#6b7280",
  INATIVA: "#6b7280",
};

export const tenantStatusLabels: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  PROSPECTO: "Prospecto",
  INADIMPLENTE: "Inadimplente",
};

export const tenantStatusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  ATIVO: "success",
  INATIVO: "secondary",
  PROSPECTO: "outline",
  INADIMPLENTE: "destructive",
};

export const proposalStatusLabels: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  EM_NEGOCIACAO: "Em negociação",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
  CONVERTIDA: "Convertida em contrato",
};

export const proposalStatusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  RASCUNHO: "outline",
  ENVIADA: "default",
  EM_NEGOCIACAO: "warning",
  APROVADA: "success",
  RECUSADA: "destructive",
  EXPIRADA: "secondary",
  CONVERTIDA: "success",
};

export const contractStatusLabels: Record<string, string> = {
  MINUTA: "Minuta",
  EM_ASSINATURA: "Em assinatura",
  ATIVO: "Ativo",
  EM_CARENCIA: "Em carência",
  PROXIMO_VENCIMENTO: "Próximo do vencimento",
  RENOVACAO: "Renovação",
  ENCERRADO: "Encerrado",
  RESCINDIDO: "Rescindido",
  SUSPENSO: "Suspenso",
};

export const contractStatusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  MINUTA: "outline",
  EM_ASSINATURA: "default",
  ATIVO: "success",
  EM_CARENCIA: "warning",
  PROXIMO_VENCIMENTO: "warning",
  RENOVACAO: "default",
  ENCERRADO: "secondary",
  RESCINDIDO: "destructive",
  SUSPENSO: "destructive",
};

export const chargeStatusLabels: Record<string, string> = {
  PREVISTA: "Prevista",
  EMITIDA: "Emitida",
  PENDENTE: "Pendente",
  PARCIALMENTE_PAGA: "Parcialmente paga",
  PAGA: "Paga",
  VENCIDA: "Vencida",
  RENEGOCIADA: "Renegociada",
  CANCELADA: "Cancelada",
};

export const chargeStatusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  PREVISTA: "outline",
  EMITIDA: "default",
  PENDENTE: "warning",
  PARCIALMENTE_PAGA: "warning",
  PAGA: "success",
  VENCIDA: "destructive",
  RENEGOCIADA: "secondary",
  CANCELADA: "secondary",
};

export const chargeTypeLabels: Record<string, string> = {
  ALUGUEL: "Aluguel",
  CONDOMINIO: "Condomínio",
  IPTU: "IPTU",
  FUNDO_PROMOCAO: "Fundo de promoção",
  AGUA: "Água",
  ENERGIA: "Energia",
  GAS: "Gás",
  MULTA: "Multa",
  JUROS: "Juros",
  CORRECAO: "Correção",
  OUTRAS_TAXAS: "Outras taxas",
};

export const ticketStatusLabels: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Em análise",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  AGUARDANDO_MATERIAL: "Aguardando material",
  EM_EXECUCAO: "Em execução",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const ticketPriorityLabels: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const ticketCategoryLabels: Record<string, string> = {
  ELETRICA: "Elétrica",
  HIDRAULICA: "Hidráulica",
  ESTRUTURAL: "Estrutural",
  LIMPEZA: "Limpeza",
  SEGURANCA: "Segurança",
  CLIMATIZACAO: "Climatização",
  OUTROS: "Outros",
};

export const documentTypeLabels: Record<string, string> = {
  CONTRATO: "Contrato",
  ADITIVO: "Aditivo",
  PROPOSTA: "Proposta",
  RG: "RG",
  CPF: "CPF",
  CONTRATO_SOCIAL: "Contrato social",
  ALVARA: "Alvará",
  SEGURO: "Seguro",
  LAUDO: "Laudo",
  PLANTA: "Planta",
  REGULAMENTO: "Regulamento",
  COMPROVANTE: "Comprovante",
  VISTORIA: "Vistoria",
  OUTROS: "Outros",
};

export const guaranteeTypeLabels: Record<string, string> = {
  CAUCAO: "Caução",
  FIADOR: "Fiador",
  SEGURO_FIANCA: "Seguro-fiança",
  TITULO_CAPITALIZACAO: "Título de capitalização",
  SEM_GARANTIA: "Sem garantia",
};

export const adjustmentIndexLabels: Record<string, string> = {
  IPCA: "IPCA",
  IGPM: "IGP-M",
  INPC: "INPC",
  PERCENTUAL_FIXO: "Percentual fixo",
};

export const personTypeLabels: Record<string, string> = {
  FISICA: "Pessoa física",
  JURIDICA: "Pessoa jurídica",
};

export const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  TRANSFERENCIA: "Transferência",
  CARTAO: "Cartão",
  DINHEIRO: "Dinheiro",
  OUTRO: "Outro",
};

export const leadStatusLabels: Record<string, string> = {
  ABERTO: "Em aberto",
  GANHO: "Ganho",
  PERDIDO: "Perdido",
};

export const inspectionTypeLabels: Record<string, string> = {
  ENTRADA: "Entrada",
  ENTREGA_CHAVES: "Entrega de chaves",
  PERIODICA: "Periódica",
  SAIDA: "Saída",
  SEGURANCA: "Segurança",
  MANUTENCAO_PREVENTIVA: "Manutenção preventiva",
};

export const inspectionItemAnswerLabels: Record<string, string> = {
  CONFORME: "Conforme",
  NAO_CONFORME: "Não conforme",
  NAO_SE_APLICA: "Não se aplica",
};

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];
