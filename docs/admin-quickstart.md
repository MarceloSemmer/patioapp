# Guia rápido do administrador — PátioGestor

## Primeiro acesso

1. Entre com um usuário de perfil **Administrador** ou **Superadministrador**
   (veja as credenciais de demonstração no README).
2. Confira **Empresas** (somente Superadministrador) para garantir que a sua
   empresa administradora está cadastrada.
3. Em **Configurações**, ajuste os prefixos de numeração automática
   (contratos, propostas, chamados) e os dias de alerta de vencimento.

## Cadastrando um novo empreendimento

1. **Empreendimentos → Novo empreendimento** — preencha os dados gerais,
   endereço (o CEP preenche automaticamente logradouro/bairro/cidade/UF) e
   áreas.
2. Dentro do empreendimento criado, use a aba **Setores** para organizar em
   blocos/pisos/setores antes de cadastrar unidades.
3. Em **Unidades → Nova unidade**, vincule cada unidade ao setor
   correspondente.
4. (Opcional) Em **Planta interativa**, envie a imagem da planta e posicione
   cada unidade desenhando um retângulo sobre a imagem — as cores seguem a
   situação da unidade automaticamente.

## Fluxo comercial completo

1. **CRM** — registre o lead e acompanhe pelas etapas do funil.
2. **Propostas → Nova proposta** — vincule o locatário (cadastre-o antes em
   **Locatários**, se ainda não existir) e as unidades desejadas.
3. Avance o status da proposta até **Aprovada**.
4. Na tela da proposta aprovada, clique em **Converter em contrato** —
   os dados da proposta pré-preenchem o novo contrato.
5. O contrato nasce como **Minuta**. Avance para **Em assinatura** e depois
   **Ativo** — a unidade muda automaticamente para "Ocupada" e passa a
   bloquear outros contratos conflitantes no mesmo período.
6. No contrato ativo, clique em **Gerar cobranças** para criar as parcelas
   mensais (aluguel + condomínio + IPTU + fundo de promoção, conforme
   cadastrado no contrato).

## Financeiro do dia a dia

- **Financeiro** lista todas as cobranças com filtros por empreendimento,
  contrato e situação.
- Para registrar um recebimento, use o menu de ações da cobrança →
  **Registrar pagamento** — informe um valor menor que o total para baixa
  parcial.
- **Régua de inadimplência** agrupa cobranças vencidas por faixa de atraso.
- Pagamentos podem ser estornados (com motivo obrigatório) em **Ver
  pagamentos / estornar**, no menu de ações da cobrança.

## Usuários e permissões

- **Usuários → Convidar usuário** cria a conta e gera um link de definição
  de senha (exibido em tela nesta versão, pois não há provedor de e-mail
  configurado — ver README).
- Cada usuário pode ser restrito a empresas específicas e, para os perfis
  Gestor/Operacional, a empreendimentos específicos.

## Onde acompanhar tudo

- **Dashboard** — indicadores em tempo real, com filtro por empreendimento
  (seletor no topo) e atalhos para cada listagem.
- **Notificações** — alertas gerados automaticamente (contratos a vencer,
  cobranças vencidas, documentos vencendo, chamados atrasados).
- **Auditoria** — histórico somente leitura de todas as ações críticas.
