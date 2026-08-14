# Modelo de dados — PátioGestor

Diagrama de entidade-relacionamento (Mermaid) com as principais entidades e
relacionamentos. O esquema completo, com todos os campos, está em
[`prisma/schema.prisma`](../prisma/schema.prisma); os nomes de tabela no
banco (via `@@map`) usam `snake_case`.

```mermaid
erDiagram
    COMPANY ||--o{ PROPERTY : possui
    COMPANY ||--|| COMPANY_SETTINGS : configura
    COMPANY ||--o{ USER_COMPANY : concede_acesso
    COMPANY ||--o{ TENANT : administra
    COMPANY ||--o{ OWNER : administra
    COMPANY ||--o{ PIPELINE_STAGE : define
    COMPANY ||--o{ DOCUMENT : armazena
    COMPANY ||--o{ AUDIT_LOG : registra
    COMPANY ||--o{ NOTIFICATION : envia

    USER ||--o{ USER_COMPANY : vincula
    USER ||--o{ USER_PROPERTY : vincula
    USER ||--o| TENANT : "e o portal de"
    USER ||--o{ MAINTENANCE_TICKET : abre
    USER ||--o{ AUDIT_LOG : gera

    PROPERTY ||--o{ SECTOR : organiza
    PROPERTY ||--o{ UNIT : contem
    PROPERTY ||--o{ FLOOR_PLAN : possui
    PROPERTY ||--o{ CONTRACT : origina
    PROPERTY ||--o{ PROPOSAL : origina
    PROPERTY ||--o{ LEAD : recebe
    PROPERTY ||--o{ MAINTENANCE_TICKET : registra
    PROPERTY ||--o{ USER_PROPERTY : restringe_acesso

    SECTOR ||--o{ UNIT : agrupa

    UNIT ||--o{ UNIT_STATUS_HISTORY : historico
    UNIT ||--o{ FLOOR_PLAN_AREA : posicao_na_planta
    UNIT ||--o{ OWNER_UNIT : pertence_a
    UNIT ||--o{ CONTRACT_UNIT : locada_em
    UNIT ||--o{ PROPOSAL_UNIT : proposta_em
    UNIT ||--o{ MAINTENANCE_TICKET : alvo_de

    FLOOR_PLAN ||--o{ FLOOR_PLAN_AREA : contem

    OWNER ||--o{ OWNER_UNIT : possui

    TENANT ||--o{ TENANT_CONTACT : possui
    TENANT ||--o{ LEAD : origina
    TENANT ||--o{ PROPOSAL : recebe
    TENANT ||--o{ CONTRACT : assina
    TENANT ||--o{ DOCUMENT : possui
    TENANT ||--o{ MAINTENANCE_TICKET : solicita

    PIPELINE_STAGE ||--o{ LEAD : contem

    LEAD ||--o{ LEAD_ACTIVITY : historico
    LEAD ||--o{ PROPOSAL : gera

    PROPOSAL ||--o{ PROPOSAL_UNIT : inclui
    PROPOSAL ||--o{ PROPOSAL_VERSION : versiona
    PROPOSAL ||--o| CONTRACT : "convertida em"

    CONTRACT ||--o{ CONTRACT_UNIT : inclui
    CONTRACT ||--o{ CONTRACT_ADDENDUM : possui
    CONTRACT ||--o{ CONTRACT_GUARANTEE : possui
    CONTRACT ||--o{ CONTRACT_ADJUSTMENT : possui
    CONTRACT ||--o{ CHARGE : gera
    CONTRACT ||--o{ DOCUMENT : possui

    ECONOMIC_INDEX ||--o{ CONTRACT_ADJUSTMENT : baseia

    CHARGE ||--o{ CHARGE_ITEM : detalha
    CHARGE ||--o{ PAYMENT_ALLOCATION : recebe_baixa

    PAYMENT ||--o{ PAYMENT_ALLOCATION : aloca

    MAINTENANCE_TICKET ||--o{ TICKET_UPDATE : historico
    MAINTENANCE_TICKET ||--o{ DOCUMENT : anexa

    DOCUMENT ||--o{ DOCUMENT_VERSION : versiona

    COMPANY {
        uuid id PK
        string name
        string cnpj
        boolean isDemo
    }
    PROPERTY {
        uuid id PK
        uuid companyId FK
        string name
        string internalCode
        enum status
        decimal leasableArea
    }
    SECTOR {
        uuid id PK
        uuid propertyId FK
        string name
        enum type
    }
    UNIT {
        uuid id PK
        uuid propertyId FK
        uuid sectorId FK
        string code
        enum type
        enum status
        decimal totalArea
    }
    TENANT {
        uuid id PK
        uuid companyId FK
        uuid portalUserId FK
        string name
        string document
        enum status
    }
    OWNER {
        uuid id PK
        uuid companyId FK
        string name
        string document
    }
    LEAD {
        uuid id PK
        uuid stageId FK
        string contactName
        enum status
    }
    PROPOSAL {
        uuid id PK
        string number
        uuid propertyId FK
        uuid tenantId FK
        enum status
    }
    CONTRACT {
        uuid id PK
        string number
        uuid propertyId FK
        uuid tenantId FK
        enum status
        date startDate
        date endDate
    }
    CHARGE {
        uuid id PK
        uuid contractId FK
        date dueDate
        decimal originalAmount
        decimal paidAmount
        enum status
    }
    PAYMENT {
        uuid id PK
        decimal amount
        enum method
        boolean isReversed
    }
    MAINTENANCE_TICKET {
        uuid id PK
        string protocol
        uuid propertyId FK
        uuid unitId FK
        enum status
        enum priority
    }
    DOCUMENT {
        uuid id PK
        uuid companyId FK
        enum type
        string fileUrl
        boolean isPrivate
    }
    USER {
        uuid id PK
        string email
        enum role
        boolean isActive
    }
    AUDIT_LOG {
        uuid id PK
        uuid userId FK
        enum action
        string entity
    }
```

## Observações de modelagem

- **UUIDs** em todas as chaves primárias.
- **Exclusão lógica** (`deletedAt`) em `properties`, `units`, `sectors`,
  `tenants`, `owners`, `contracts` e `documents` — nunca removidos
  fisicamente, conforme a regra de negócio de preservar histórico.
- **Valores monetários** sempre `Decimal` (nunca `Float`), mapeados para
  `NUMERIC` no PostgreSQL.
- **Histórico obrigatório**: `unit_status_history`, `contract_adjustments`,
  `ticket_updates`, `payment_allocations` e `audit_logs` nunca são
  sobrescritos — cada mudança gera uma nova linha.
- **Isolamento multiempresa**: praticamente toda tabela de negócio encadeia
  até `companies` (diretamente ou via `properties`/`tenants`), permitindo
  filtrar por empresa em uma única condição de `JOIN`.
