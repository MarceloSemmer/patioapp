/**
 * Configuração central da aplicação.
 * Alterar o nome do sistema, marca e parâmetros regionais aqui —
 * nenhuma tela deve conter o nome do sistema de forma fixa (hardcoded).
 */
export const appConfig = {
  systemName: "PátioGestor",
  systemShortName: "PátioGestor",
  systemDescription:
    "Plataforma de gestão de pátios comerciais, street malls, lojas, quiosques e boxes.",
  locale: "pt-BR",
  currency: "BRL",
  currencySymbol: "R$",
  timezone: "America/Sao_Paulo",
  dateFormat: "dd/MM/yyyy",
  dateTimeFormat: "dd/MM/yyyy HH:mm",
  demoModeLabel: "Ambiente de demonstração — dados fictícios",
  contractExpiryAlertDays: [180, 120, 90, 60, 30],
  delinquencyBuckets: [
    { label: "1 a 5 dias", min: 1, max: 5 },
    { label: "6 a 15 dias", min: 6, max: 15 },
    { label: "16 a 30 dias", min: 16, max: 30 },
    { label: "31 a 60 dias", min: 31, max: 60 },
    { label: "Acima de 60 dias", min: 61, max: null },
  ],
} as const;

export type AppConfig = typeof appConfig;
