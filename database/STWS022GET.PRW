/*
 * STWS022GET.PRW
 * SettaFlow - Acordos de Pagamento
 * Metodo: GET
 *
 * Endpoint:
 *   GET /rest/STWS022/listar?codcli={cod}&loja={loja}[&status={status}]
 */

#Include 'Protheus.ch'
#Include 'RestFul.ch'
#Include 'Tbiconn.ch'

WSRESTFUL STWS022G DESCRIPTION "SettaFlow - Acordos GET"
    WSDATA oBody   AS VARIANT
    WSDATA cResult AS STRING

    WSMETHOD GET LISTAR DESCRIPTION "Listar acordos do cliente" WSSYNTAX "/STWS022/listar"
END WSRESTFUL

/*--------------------------------------------------------------------
  GET /rest/STWS022/listar?codcli=000001&loja=01
  Parametro opcional: &status=em_aberto
  Retorna array JSON com acordos do cliente, ordenados por data desc
--------------------------------------------------------------------*/
WSMETHOD LISTAR WSSERVICE STWS022G
    Local cCodCli := Trim(Self:GetQueryRequest("codcli"))
    Local cLoja   := Trim(Self:GetQueryRequest("loja"))
    Local cStatus := Trim(Self:GetQueryRequest("status"))
    Local cAlias  := GetNextAlias()
    Local cQuery  := ""
    Local oArray  := FWJsonArray():New()
    Local oItem   := Nil

    If Empty(cCodCli)
        SetRestFault(400, '{"erro":"Parametro codcli obrigatorio"}')
        Return .F.
    EndIf

    cLoja := If(Empty(cLoja), "01", cLoja)

    cQuery := "SELECT * FROM " + RetSqlName("ZAC010") + " WHERE "
    cQuery +=   "R_E_C_D_E_L_ <> '*' AND "
    cQuery +=   "ZAC_FILIAL = '" + FwFiliAl()              + "' AND "
    cQuery +=   "ZAC_CODCLI = '" + PadR(Upper(cCodCli), 6) + "' AND "
    cQuery +=   "ZAC_LOJA   = '" + PadR(cLoja, 2)          + "' "

    If !Empty(cStatus)
        cQuery += "AND ZAC_STATUS = '" + PadR(cStatus, 20) + "' "
    EndIf

    cQuery += "ORDER BY ZAC_DATA DESC"

    TCQuery cQuery New Alias cAlias

    While !(cAlias)->(EoF())
        oItem := FWJsonObject():New()
        oItem:SetData("ZAC_FILIAL",  RTrim((cAlias)->ZAC_FILIAL))
        oItem:SetData("ZAC_NUM",     RTrim((cAlias)->ZAC_NUM))
        oItem:SetData("ZAC_CODCLI",  RTrim((cAlias)->ZAC_CODCLI))
        oItem:SetData("ZAC_LOJA",    RTrim((cAlias)->ZAC_LOJA))
        oItem:SetData("ZAC_NOMCLI",  RTrim((cAlias)->ZAC_NOMCLI))
        oItem:SetData("ZAC_USUARIO", RTrim((cAlias)->ZAC_USUARIO))
        oItem:SetData("ZAC_DATA",    RTrim((cAlias)->ZAC_DATA))
        oItem:SetData("ZAC_VALOR",   (cAlias)->ZAC_VALOR)
        oItem:SetData("ZAC_QTPARC",  (cAlias)->ZAC_QTPARC)
        oItem:SetData("ZAC_VLPARC",  (cAlias)->ZAC_VLPARC)
        oItem:SetData("ZAC_DTVPRO",  RTrim((cAlias)->ZAC_DTVPRO))
        oItem:SetData("ZAC_STATUS",  RTrim((cAlias)->ZAC_STATUS))
        oItem:SetData("ZAC_OBS",     RTrim((cAlias)->ZAC_OBS))
        oArray:AddItem(oItem)

        (cAlias)->(DbSkip())
    EndDo

    (cAlias)->(DbCloseArea())

    Self:SetContentType("application/json")
    Self:SetResponse(FWJsonSerialize(oArray))
    Return .T.

End WSMETHOD
