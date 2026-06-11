/*
 * STWS021GET.PRW
 * SettaFlow - Tratativas de Cobranca
 * Metodo: GET
 *
 * Endpoint:
 *   GET /rest/STWS021/listar?codcli={cod}&loja={loja}
 */

#Include 'Protheus.ch'
#Include 'RestFul.ch'
#Include 'Tbiconn.ch'

WSRESTFUL STWS021G DESCRIPTION "SettaFlow - Tratativas GET"
    WSDATA oBody   AS VARIANT
    WSDATA cResult AS STRING

    WSMETHOD GET LISTAR DESCRIPTION "Listar tratativas do cliente" WSSYNTAX "/STWS021/listar"
END WSRESTFUL

/*--------------------------------------------------------------------
  GET /rest/STWS021/listar?codcli=000001&loja=01
  Retorna array JSON com tratativas do cliente, ordenadas por data desc
--------------------------------------------------------------------*/
WSMETHOD LISTAR WSSERVICE STWS021G
    Local cCodCli := Trim(Self:GetQueryRequest("codcli"))
    Local cLoja   := Trim(Self:GetQueryRequest("loja"))
    Local cAlias  := GetNextAlias()
    Local cQuery  := ""
    Local oArray  := FWJsonArray():New()
    Local oItem   := Nil
    Local cAnexos := ""

    If Empty(cCodCli)
        SetRestFault(400, '{"erro":"Parametro codcli obrigatorio"}')
        Return .F.
    EndIf

    cLoja := If(Empty(cLoja), "01", cLoja)

    cQuery := "SELECT * FROM " + RetSqlName("ZTR010") + " WHERE "
    cQuery +=   "R_E_C_D_E_L_ <> '*' AND "
    cQuery +=   "ZTR_FILIAL = '" + FwFiliAl()              + "' AND "
    cQuery +=   "ZTR_CODCLI = '" + PadR(Upper(cCodCli), 6) + "' AND "
    cQuery +=   "ZTR_LOJA   = '" + PadR(cLoja, 2)          + "' "
    cQuery += "ORDER BY ZTR_DATA DESC, ZTR_HORA DESC"

    TCQuery cQuery New Alias cAlias

    While !(cAlias)->(EoF())
        cAnexos := AllTrim(Iif(ValType((cAlias)->ZTR_ANEXOS) == "C", (cAlias)->ZTR_ANEXOS, ""))

        oItem := FWJsonObject():New()
        oItem:SetData("ZTR_FILIAL",  RTrim((cAlias)->ZTR_FILIAL))
        oItem:SetData("ZTR_ID",      RTrim((cAlias)->ZTR_ID))
        oItem:SetData("ZTR_CODCLI",  RTrim((cAlias)->ZTR_CODCLI))
        oItem:SetData("ZTR_LOJA",    RTrim((cAlias)->ZTR_LOJA))
        oItem:SetData("ZTR_NOMCLI",  RTrim((cAlias)->ZTR_NOMCLI))
        oItem:SetData("ZTR_USUARIO", RTrim((cAlias)->ZTR_USUARIO))
        oItem:SetData("ZTR_DATA",    RTrim((cAlias)->ZTR_DATA))
        oItem:SetData("ZTR_HORA",    RTrim((cAlias)->ZTR_HORA))
        oItem:SetData("ZTR_TPCONT",  RTrim((cAlias)->ZTR_TPCONT))
        oItem:SetData("ZTR_STATUS",  RTrim((cAlias)->ZTR_STATUS))
        oItem:SetData("ZTR_OBS",     RTrim((cAlias)->ZTR_OBS))
        oItem:SetData("ZTR_PROXAC",  RTrim((cAlias)->ZTR_PROXAC))
        oItem:SetData("ZTR_DTPROX",  RTrim((cAlias)->ZTR_DTPROX))
        oItem:SetData("ZTR_ANEXOS",  cAnexos)
        oArray:AddItem(oItem)

        (cAlias)->(DbSkip())
    EndDo

    (cAlias)->(DbCloseArea())

    Self:SetContentType("application/json")
    Self:SetResponse(FWJsonSerialize(oArray))
    Return .T.

End WSMETHOD
