/*
 * STWS021POST.PRW
 * SettaFlow - Tratativas de Cobranca
 * Metodo: POST
 *
 * Endpoint:
 *   POST /rest/STWS021/gravar
 *
 * Body (JSON):
 *   {
 *     "ZTR_FILIAL":  "0201",
 *     "ZTR_ID":      "uuid-v4",
 *     "ZTR_CODCLI":  "000001",
 *     "ZTR_LOJA":    "01",
 *     "ZTR_NOMCLI":  "RAZAO SOCIAL LTDA",
 *     "ZTR_USUARIO": "Ana Costa",
 *     "ZTR_DATA":    "20250608",
 *     "ZTR_HORA":    "14:32:00",
 *     "ZTR_TPCONT":  "ligacao",
 *     "ZTR_STATUS":  "em_cobranca",
 *     "ZTR_OBS":     "Cliente prometeu pagar ate sexta-feira",
 *     "ZTR_PROXAC":  "Ligar novamente",
 *     "ZTR_DTPROX":  "20250613",
 *     "ZTR_ANEXOS":  "[{\"nome\":\"comprovante.pdf\",\"tamanho\":102400,\"tipo\":\"application/pdf\"}]"
 *   }
 *
 * Resposta de sucesso (HTTP 200):
 *   { "sucesso": true, "ZTR_ID": "uuid-v4" }
 */

#Include 'Protheus.ch'
#Include 'RestFul.ch'
#Include 'Tbiconn.ch'

WSRESTFUL STWS021P DESCRIPTION "SettaFlow - Tratativas POST"
    WSDATA oBody   AS VARIANT
    WSDATA cResult AS STRING

    WSMETHOD POST GRAVAR DESCRIPTION "Gravar nova tratativa" WSSYNTAX "/STWS021/gravar"
END WSRESTFUL

/*--------------------------------------------------------------------
  POST /rest/STWS021/gravar
  Insere um novo registro em ZTR010.
  Idempotente: se ZTR_ID ja existe retorna HTTP 409.
--------------------------------------------------------------------*/
WSMETHOD GRAVAR WSSERVICE STWS021P
    Local oBody  := Nil
    Local lErr   := .F.
    Local cId    := ""
    Local cAlias := GetNextAlias()
    Local cQuery := ""

    oBody := FWJsonDeserialize(Self:GetContent(), @lErr)

    If lErr .Or. ValType(oBody) <> "O"
        SetRestFault(400, '{"erro":"JSON invalido no body"}')
        Return .F.
    EndIf

    cId := AllTrim(oBody:GetJsonObject("ZTR_ID"))

    If Empty(cId)
        SetRestFault(400, '{"erro":"ZTR_ID obrigatorio"}')
        Return .F.
    EndIf

    If Empty(AllTrim(oBody:GetJsonObject("ZTR_CODCLI")))
        SetRestFault(400, '{"erro":"ZTR_CODCLI obrigatorio"}')
        Return .F.
    EndIf

    If Empty(AllTrim(oBody:GetJsonObject("ZTR_OBS")))
        SetRestFault(400, '{"erro":"ZTR_OBS obrigatorio"}')
        Return .F.
    EndIf

    // Idempotencia: impede duplicidade pelo UUID
    cQuery := "SELECT R_E_C_N_O_ FROM " + RetSqlName("ZTR010") + " WHERE "
    cQuery +=   "ZTR_ID = '" + cId + "' AND R_E_C_D_E_L_ <> '*'"
    TCQuery cQuery New Alias cAlias

    If !(cAlias)->(EoF())
        (cAlias)->(DbCloseArea())
        SetRestFault(409, '{"erro":"Tratativa ja registrada com este ZTR_ID"}')
        Return .F.
    EndIf
    (cAlias)->(DbCloseArea())

    // Insere em ZTR010
    DbSelectArea("ZTR010")
    RecLock("ZTR010", .T.)
        ZTR010->ZTR_FILIAL  := PadR(AllTrim(oBody:GetJsonObject("ZTR_FILIAL")) , 8  )
        ZTR010->ZTR_ID      := PadR(cId                                        , 36 )
        ZTR010->ZTR_CODCLI  := PadR(AllTrim(oBody:GetJsonObject("ZTR_CODCLI")) , 6  )
        ZTR010->ZTR_LOJA    := PadR(AllTrim(oBody:GetJsonObject("ZTR_LOJA"))   , 2  )
        ZTR010->ZTR_NOMCLI  := PadR(AllTrim(oBody:GetJsonObject("ZTR_NOMCLI")) , 100)
        ZTR010->ZTR_USUARIO := PadR(AllTrim(oBody:GetJsonObject("ZTR_USUARIO")), 50 )
        ZTR010->ZTR_DATA    := PadR(AllTrim(oBody:GetJsonObject("ZTR_DATA"))   , 8  )
        ZTR010->ZTR_HORA    := PadR(AllTrim(oBody:GetJsonObject("ZTR_HORA"))   , 8  )
        ZTR010->ZTR_TPCONT  := PadR(AllTrim(oBody:GetJsonObject("ZTR_TPCONT")) , 20 )
        ZTR010->ZTR_STATUS  := PadR(AllTrim(oBody:GetJsonObject("ZTR_STATUS")) , 30 )
        ZTR010->ZTR_OBS     :=      Left(AllTrim(oBody:GetJsonObject("ZTR_OBS")), 500)
        ZTR010->ZTR_PROXAC  := PadR(AllTrim(oBody:GetJsonObject("ZTR_PROXAC")) , 100)
        ZTR010->ZTR_DTPROX  := PadR(AllTrim(oBody:GetJsonObject("ZTR_DTPROX")) , 8  )
        ZTR010->ZTR_ANEXOS  := AllTrim(oBody:GetJsonObject("ZTR_ANEXOS"))
    MsUnlock()

    Self:SetContentType("application/json")
    Self:SetResponse('{"sucesso":true,"ZTR_ID":"' + cId + '"}')
    Return .T.

End WSMETHOD
