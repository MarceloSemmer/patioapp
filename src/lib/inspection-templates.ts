import type { InspectionType } from "@prisma/client";

/**
 * Checklists padrão sugeridos por tipo de vistoria — ponto de partida
 * editável pelo usuário no formulário (itens podem ser removidos/incluídos
 * antes de salvar), nunca uma lista fixa imposta pelo sistema.
 */
export const DEFAULT_CHECKLIST_ITEMS: Record<InspectionType, string[]> = {
  ENTRADA: [
    "Pisos sem trincas ou manchas",
    "Paredes e pintura em bom estado",
    "Portas e fechaduras funcionando",
    "Instalações elétricas (tomadas, interruptores, quadro)",
    "Instalações hidráulicas (registros, torneiras, ralos)",
    "Vidros e esquadrias íntegros",
    "Limpeza geral do imóvel",
  ],
  ENTREGA_CHAVES: [
    "Todas as chaves e controles de acesso entregues",
    "Vistoria de entrada assinada pelo locatário",
    "Leitura de medidores registrada (água/energia)",
  ],
  PERIODICA: [
    "Conservação geral da unidade",
    "Sinais de infiltração ou umidade",
    "Instalações elétricas e hidráulicas em funcionamento",
    "Cumprimento do uso previsto em contrato",
  ],
  SAIDA: [
    "Pisos sem trincas ou manchas além do desgaste natural",
    "Paredes e pintura em bom estado",
    "Portas e fechaduras funcionando",
    "Instalações elétricas (tomadas, interruptores, quadro)",
    "Instalações hidráulicas (registros, torneiras, ralos)",
    "Vidros e esquadrias íntegros",
    "Limpeza geral do imóvel",
    "Comparação com o laudo de entrada",
  ],
  SEGURANCA: [
    "Extintores dentro da validade",
    "Saídas de emergência desobstruídas",
    "Sinalização de segurança visível",
    "Sistema de alarme/CFTV operante",
  ],
  MANUTENCAO_PREVENTIVA: [
    "Ar-condicionado / climatização",
    "Sistema elétrico e quadro de distribuição",
    "Sistema hidráulico e caixas d'água",
    "Cobertura e calhas",
  ],
};
