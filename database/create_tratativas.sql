-- =============================================
-- Tabela: ZTR010 - Tratativas de Cobrança
-- Sistema: SettaFlow / Protheus TOTVS
-- Banco:   SQL Server
--
-- Convenção Protheus:
--   - Prefixo de coluna: ZTR_
--   - Datas armazenadas como CHAR(8) no formato AAAAMMDD
--   - R_E_C_N_O_ = chave interna auto-increment
--   - R_E_C_D_E_L_ / D_E_L_E_T_ = exclusão lógica (soft delete)
-- =============================================

IF OBJECT_ID('ZTR010', 'U') IS NOT NULL
    DROP TABLE ZTR010
GO

CREATE TABLE ZTR010 (

    -- ── Colunas padrão Protheus ────────────────────────────────────────
    R_E_C_N_O_      INT IDENTITY(1,1)   NOT NULL,
    R_E_C_D_E_L_    CHAR(1)             NOT NULL CONSTRAINT DF_ZTR_DEL1 DEFAULT ' ',
    D_E_L_E_T_      CHAR(1)             NOT NULL CONSTRAINT DF_ZTR_DEL2 DEFAULT ' ',

    -- ── Chave de negócio ───────────────────────────────────────────────
    ZTR_FILIAL      CHAR(8)             NOT NULL CONSTRAINT DF_ZTR_FILIAL  DEFAULT '        ',  -- Filial (ex: 0201)
    ZTR_ID          CHAR(36)            NOT NULL CONSTRAINT DF_ZTR_ID      DEFAULT '',          -- UUID gerado no front-end

    -- ── Dados do cliente ──────────────────────────────────────────────
    ZTR_CODCLI      CHAR(6)             NOT NULL CONSTRAINT DF_ZTR_CODCLI  DEFAULT '',          -- SA1.A1_COD
    ZTR_LOJA        CHAR(2)             NOT NULL CONSTRAINT DF_ZTR_LOJA    DEFAULT '',          -- SA1.A1_LOJA
    ZTR_NOMCLI      CHAR(100)           NOT NULL CONSTRAINT DF_ZTR_NOMCLI  DEFAULT '',          -- Razão social

    -- ── Dados do contato ──────────────────────────────────────────────
    ZTR_USUARIO     CHAR(50)            NOT NULL CONSTRAINT DF_ZTR_USR     DEFAULT '',          -- Usuário responsável
    ZTR_DATA        CHAR(8)             NOT NULL CONSTRAINT DF_ZTR_DATA    DEFAULT '',          -- Data do contato  (AAAAMMDD)
    ZTR_HORA        CHAR(8)             NOT NULL CONSTRAINT DF_ZTR_HORA    DEFAULT '',          -- Hora do contato  (HH:MM:SS)
    ZTR_TPCONT      CHAR(20)            NOT NULL CONSTRAINT DF_ZTR_TPCONT  DEFAULT '',
        -- Valores: ligacao | email | whatsapp | visita | carta
    ZTR_STATUS      CHAR(30)            NOT NULL CONSTRAINT DF_ZTR_STATUS  DEFAULT '',
        -- Valores: em_cobranca | negociacao | promessa_pagamento | aguardando_retorno | acordo_realizado | sem_acordo
    ZTR_OBS         VARCHAR(500)        NOT NULL CONSTRAINT DF_ZTR_OBS     DEFAULT '',          -- Observação do contato

    -- ── Próxima ação agendada ─────────────────────────────────────────
    ZTR_PROXAC      CHAR(100)           NOT NULL CONSTRAINT DF_ZTR_PROXAC  DEFAULT '',          -- Descrição
    ZTR_DTPROX      CHAR(8)             NOT NULL CONSTRAINT DF_ZTR_DTPROX  DEFAULT '',          -- Data (AAAAMMDD)

    -- ── Anexos (metadados em JSON) ────────────────────────────────────
    ZTR_ANEXOS      VARCHAR(MAX)                 CONSTRAINT DF_ZTR_ANEXOS  DEFAULT NULL,
        -- Formato: [{"nome":"arquivo.pdf","tamanho":102400,"tipo":"application/pdf"}]

    CONSTRAINT PK_ZTR010 PRIMARY KEY CLUSTERED (R_E_C_N_O_)
)
GO

-- ── Índices ───────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IDX_ZTR010_ID     ON ZTR010 (ZTR_FILIAL, ZTR_ID)                WHERE R_E_C_D_E_L_ = ' '
CREATE        INDEX IDX_ZTR010_CLI    ON ZTR010 (ZTR_FILIAL, ZTR_CODCLI, ZTR_LOJA)  WHERE R_E_C_D_E_L_ = ' '
CREATE        INDEX IDX_ZTR010_DATA   ON ZTR010 (ZTR_DATA   DESC)                    WHERE R_E_C_D_E_L_ = ' '
CREATE        INDEX IDX_ZTR010_PROX   ON ZTR010 (ZTR_DTPROX ASC)                    WHERE R_E_C_D_E_L_ = ' '
GO

-- ── Comentário nas colunas ────────────────────────────────────────────────
EXEC sp_addextendedproperty 'MS_Description', 'Tratativas de cobrança — SettaFlow',         'SCHEMA','dbo','TABLE','ZTR010', NULL, NULL
EXEC sp_addextendedproperty 'MS_Description', 'UUID único da tratativa (gerado no cliente)', 'SCHEMA','dbo','TABLE','ZTR010','COLUMN','ZTR_ID'
EXEC sp_addextendedproperty 'MS_Description', 'Data no formato AAAAMMDD',                   'SCHEMA','dbo','TABLE','ZTR010','COLUMN','ZTR_DATA'
EXEC sp_addextendedproperty 'MS_Description', 'JSON: [{nome, tamanho, tipo}]',               'SCHEMA','dbo','TABLE','ZTR010','COLUMN','ZTR_ANEXOS'
GO
