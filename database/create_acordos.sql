-- =============================================
-- Tabela: ZAC010 - Acordos de Pagamento
-- Sistema: SettaFlow / Protheus TOTVS
-- Banco:   SQL Server
--
-- Convenção Protheus:
--   - Prefixo de coluna: ZAC_
--   - Datas armazenadas como CHAR(8) no formato AAAAMMDD
--   - R_E_C_N_O_ = chave interna auto-increment
--   - R_E_C_D_E_L_ / D_E_L_E_T_ = exclusão lógica (soft delete)
-- =============================================

IF OBJECT_ID('ZAC010', 'U') IS NOT NULL
    DROP TABLE ZAC010
GO

CREATE TABLE ZAC010 (

    -- ── Colunas padrão Protheus ────────────────────────────────────────
    R_E_C_N_O_      INT IDENTITY(1,1)   NOT NULL,
    R_E_C_D_E_L_    CHAR(1)             NOT NULL CONSTRAINT DF_ZAC_DEL1 DEFAULT ' ',
    D_E_L_E_T_      CHAR(1)             NOT NULL CONSTRAINT DF_ZAC_DEL2 DEFAULT ' ',

    -- ── Chave de negócio ───────────────────────────────────────────────
    ZAC_FILIAL      CHAR(8)             NOT NULL CONSTRAINT DF_ZAC_FILIAL  DEFAULT '        ',  -- Filial (ex: 0201)
    ZAC_NUM         CHAR(36)            NOT NULL CONSTRAINT DF_ZAC_NUM     DEFAULT '',          -- UUID gerado no front-end

    -- ── Dados do cliente ──────────────────────────────────────────────
    ZAC_CODCLI      CHAR(6)             NOT NULL CONSTRAINT DF_ZAC_CODCLI  DEFAULT '',          -- SA1.A1_COD
    ZAC_LOJA        CHAR(2)             NOT NULL CONSTRAINT DF_ZAC_LOJA    DEFAULT '',          -- SA1.A1_LOJA
    ZAC_NOMCLI      CHAR(100)           NOT NULL CONSTRAINT DF_ZAC_NOMCLI  DEFAULT '',          -- Razão social

    -- ── Dados do acordo ───────────────────────────────────────────────
    ZAC_USUARIO     CHAR(50)            NOT NULL CONSTRAINT DF_ZAC_USR     DEFAULT '',          -- Usuário que firmou
    ZAC_DATA        CHAR(8)             NOT NULL CONSTRAINT DF_ZAC_DATA    DEFAULT '',          -- Data do acordo  (AAAAMMDD)
    ZAC_VALOR       NUMERIC(18,2)       NOT NULL CONSTRAINT DF_ZAC_VALOR   DEFAULT 0,           -- Valor total negociado
    ZAC_QTPARC      SMALLINT            NOT NULL CONSTRAINT DF_ZAC_QTPARC  DEFAULT 0,           -- Quantidade de parcelas
    ZAC_VLPARC      NUMERIC(18,2)       NOT NULL CONSTRAINT DF_ZAC_VLPARC  DEFAULT 0,           -- Valor de cada parcela (VALOR / QTPARC)
    ZAC_DTVPRO      CHAR(8)             NOT NULL CONSTRAINT DF_ZAC_DTVPRO  DEFAULT '',          -- Vencimento 1ª parcela (AAAAMMDD)
    ZAC_STATUS      CHAR(20)            NOT NULL CONSTRAINT DF_ZAC_STATUS  DEFAULT '',
        -- Valores: em_aberto | cumprido | quebrado
    ZAC_OBS         VARCHAR(500)        NOT NULL CONSTRAINT DF_ZAC_OBS     DEFAULT '',          -- Observações

    CONSTRAINT PK_ZAC010 PRIMARY KEY CLUSTERED (R_E_C_N_O_)
)
GO

-- ── Índices ───────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IDX_ZAC010_NUM    ON ZAC010 (ZAC_FILIAL, ZAC_NUM)               WHERE R_E_C_D_E_L_ = ' '
CREATE        INDEX IDX_ZAC010_CLI    ON ZAC010 (ZAC_FILIAL, ZAC_CODCLI, ZAC_LOJA)  WHERE R_E_C_D_E_L_ = ' '
CREATE        INDEX IDX_ZAC010_DATA   ON ZAC010 (ZAC_DATA   DESC)                   WHERE R_E_C_D_E_L_ = ' '
CREATE        INDEX IDX_ZAC010_STATUS ON ZAC010 (ZAC_STATUS)                        WHERE R_E_C_D_E_L_ = ' '
GO

-- ── Comentários nas colunas ───────────────────────────────────────────────
EXEC sp_addextendedproperty 'MS_Description', 'Acordos de pagamento — SettaFlow',           'SCHEMA','dbo','TABLE','ZAC010', NULL, NULL
EXEC sp_addextendedproperty 'MS_Description', 'UUID único do acordo (gerado no front-end)', 'SCHEMA','dbo','TABLE','ZAC010','COLUMN','ZAC_NUM'
EXEC sp_addextendedproperty 'MS_Description', 'Data no formato AAAAMMDD',                  'SCHEMA','dbo','TABLE','ZAC010','COLUMN','ZAC_DATA'
EXEC sp_addextendedproperty 'MS_Description', 'Calculado: ZAC_VALOR / ZAC_QTPARC',         'SCHEMA','dbo','TABLE','ZAC010','COLUMN','ZAC_VLPARC'
GO
