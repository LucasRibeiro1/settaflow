/*
 * STWS022POST.PRW
 * SettaFlow - Acordos de Pagamento
 * Metodo: POST
 *
 * Endpoints:
 *   POST /rest/STWS022/gravar    -> insere novo acordo
 *   POST /rest/STWS022/atualizar -> atualiza status de acordo existente
 *
 * Body gravar (JSON):
 *   {
 *     "ZAC_FILIAL":  "0201",
 *     "ZAC_NUM":     "uuid-v4",
 *     "ZAC_CODCLI":  "000001",
 *     "ZAC_LOJA":    "01",
 *     "ZAC_NOMCLI":  "RAZAO SOCIAL LTDA",
 *     "ZAC_USUARIO": "Ana Costa",
 *     "ZAC_DATA":    "20250608",
 *     "ZAC_VALOR":   15000.00,
 *     "ZAC_QTPARC":  3,
 *     "ZAC_DTVPRO":  "20250701",
 *     "ZAC_STATUS":  "em_aberto",
 *     "ZAC_OBS":     "Acordo parcelado em 3x"
 *   }
 *
 * Body atualizar (JSON):
 *   {
 *     "ZAC_NUM":    "uuid-v4",
 *     "ZAC_STATUS": "cumprido"
 *   }
 *   Valores validos para ZAC_STATUS: em_aberto | cumprido | quebrado
 *
 * Resposta de sucesso gravar (HTTP 200):
 *   { "sucesso": true, "ZAC_NUM": "uuid", "ZAC_VLPARC": 5000.00 }
 *
 * Resposta de sucesso atualizar (HTTP 200):
 *   { "sucesso": true, "ZAC_NUM": "uuid", "ZAC_STATUS": "cumprido" }
 */

#Include 'Protheus.ch'
#Include 'RestFul.ch'
#Include 'Tbiconn.ch'

WSRESTFUL STWS022P DESCRIPTION "SettaFlow - Acordos POST"
    WSDATA oBody   AS VARIANT
    WSDATA cResult AS STRING

    WSMETHOD POST GRAVAR    DESCRIPTION "Gravar novo acordo"          WSSYNTAX "/STWS022/gravar"
    WSMETHOD POST ATUALIZAR DESCRIPTION "Atualizar status do acordo"  WSSYNTAX "/STWS022/atualizar"
END WSRESTFUL

/*--------------------------------------------------------------------
  POST /rest/STWS022/gravar
  Insere um novo registro em ZAC010.
  ZAC_VLPARC e calculado no servidor: ZAC_VALOR / ZAC_QTPARC
  Idempotente: se ZAC_NUM ja existe retorna HTTP 409.
--------------------------------------------------------------------*/
WSMETHOD GRAVAR WSSERVICE STWS022P
    Local oBody   := Nil
    Local lErr    := .F.
    Local cNum    := ""
    Local nValor  := 0
    Local nQtParc := 0
    Local nVlParc := 0
    Local cAlias  := GetNextAlias()
    Local cQuery  := ""

    oBody := FWJsonDeserialize(Self:GetContent(), @lErr)

    If lErr .Or. ValType(oBody) <> "O"
        SetRestFault(400, '{"erro":"JSON invalido no body"}')
        Return .F.
    EndIf

    cNum := AllTrim(oBody:GetJsonObject("ZAC_NUM"))

    If Empty(cNum)
        SetRestFault(400, '{"erro":"ZAC_NUM obrigatorio"}')
        Return .F.
    EndIf

    nValor  := Val(oBody:GetJsonObject("ZAC_VALOR"))
    nQtParc := Val(oBody:GetJsonObject("ZAC_QTPARC"))

    If nValor <= 0
        SetRestFault(400, '{"erro":"ZAC_VALOR deve ser maior que zero"}')
        Return .F.
    EndIf

    If nQtParc <= 0
        SetRestFault(400, '{"erro":"ZAC_QTPARC deve ser maior que zero"}')
        Return .F.
    EndIf

    // Idempotencia: impede duplicidade pelo UUID
    cQuery := "SELECT R_E_C_N_O_ FROM " + RetSqlName("ZAC010") + " WHERE "
    cQuery +=   "ZAC_NUM = '" + cNum + "' AND R_E_C_D_E_L_ <> '*'"
    TCQuery cQuery New Alias cAlias

    If !(cAlias)->(EoF())
        (cAlias)->(DbCloseArea())
        SetRestFault(409, '{"erro":"Acordo ja registrado com este ZAC_NUM"}')
        Return .F.
    EndIf
    (cAlias)->(DbCloseArea())

    // Calcula valor por parcela no servidor
    nVlParc := Round(nValor / nQtParc, 2)

    // Insere em ZAC010
    DbSelectArea("ZAC010")
    RecLock("ZAC010", .T.)
        ZAC010->ZAC_FILIAL  := PadR(AllTrim(oBody:GetJsonObject("ZAC_FILIAL")) , 8  )
        ZAC010->ZAC_NUM     := PadR(cNum                                       , 36 )
        ZAC010->ZAC_CODCLI  := PadR(AllTrim(oBody:GetJsonObject("ZAC_CODCLI")) , 6  )
        ZAC010->ZAC_LOJA    := PadR(AllTrim(oBody:GetJsonObject("ZAC_LOJA"))   , 2  )
        ZAC010->ZAC_NOMCLI  := PadR(AllTrim(oBody:GetJsonObject("ZAC_NOMCLI")) , 100)
        ZAC010->ZAC_USUARIO := PadR(AllTrim(oBody:GetJsonObject("ZAC_USUARIO")), 50 )
        ZAC010->ZAC_DATA    := PadR(AllTrim(oBody:GetJsonObject("ZAC_DATA"))   , 8  )
        ZAC010->ZAC_VALOR   := nValor
        ZAC010->ZAC_QTPARC  := nQtParc
        ZAC010->ZAC_VLPARC  := nVlParc
        ZAC010->ZAC_DTVPRO  := PadR(AllTrim(oBody:GetJsonObject("ZAC_DTVPRO")) , 8  )
        ZAC010->ZAC_STATUS  := PadR(AllTrim(oBody:GetJsonObject("ZAC_STATUS"))  , 20 )
        ZAC010->ZAC_OBS     :=      Left(AllTrim(oBody:GetJsonObject("ZAC_OBS")), 500)
    MsUnlock()

    Self:SetContentType("application/json")
    Self:SetResponse('{"sucesso":true,"ZAC_NUM":"' + cNum + '","ZAC_VLPARC":' + Str(nVlParc, 15, 2) + '}')
    Return .T.

End WSMETHOD

/*--------------------------------------------------------------------
  POST /rest/STWS022/atualizar
  Atualiza o ZAC_STATUS de um acordo existente.
  Valores validos: em_aberto | cumprido | quebrado
--------------------------------------------------------------------*/
WSMETHOD ATUALIZAR WSSERVICE STWS022P
    Local oBody   := Nil
    Local lErr    := .F.
    Local cNum    := ""
    Local cStatus := ""
    Local cAlias  := GetNextAlias()
    Local cQuery  := ""
    Local aStatus := {"em_aberto", "cumprido", "quebrado"}
    Local lValido := .F.
    Local i       := 0

    oBody := FWJsonDeserialize(Self:GetContent(), @lErr)

    If lErr .Or. ValType(oBody) <> "O"
        SetRestFault(400, '{"erro":"JSON invalido no body"}')
        Return .F.
    EndIf

    cNum    := AllTrim(oBody:GetJsonObject("ZAC_NUM"))
    cStatus := AllTrim(oBody:GetJsonObject("ZAC_STATUS"))

    If Empty(cNum)
        SetRestFault(400, '{"erro":"ZAC_NUM obrigatorio"}')
        Return .F.
    EndIf

    If Empty(cStatus)
        SetRestFault(400, '{"erro":"ZAC_STATUS obrigatorio"}')
        Return .F.
    EndIf

    For i := 1 To Len(aStatus)
        If aStatus[i] == cStatus
            lValido := .T.
            Exit
        EndIf
    Next i

    If !lValido
        SetRestFault(400, '{"erro":"ZAC_STATUS invalido. Use: em_aberto, cumprido ou quebrado"}')
        Return .F.
    EndIf

    // Localiza registro pelo UUID
    cQuery := "SELECT R_E_C_N_O_ FROM " + RetSqlName("ZAC010") + " WHERE "
    cQuery +=   "ZAC_NUM = '" + cNum + "' AND R_E_C_D_E_L_ <> '*'"
    TCQuery cQuery New Alias cAlias

    If (cAlias)->(EoF())
        (cAlias)->(DbCloseArea())
        SetRestFault(404, '{"erro":"Acordo nao encontrado"}')
        Return .F.
    EndIf

    DbSelectArea("ZAC010")
    DbGoto((cAlias)->R_E_C_N_O_)
    (cAlias)->(DbCloseArea())

    RecLock("ZAC010", .F.)
        ZAC010->ZAC_STATUS := PadR(cStatus, 20)
    MsUnlock()

    Self:SetContentType("application/json")
    Self:SetResponse('{"sucesso":true,"ZAC_NUM":"' + cNum + '","ZAC_STATUS":"' + cStatus + '"}')
    Return .T.

End WSMETHOD
