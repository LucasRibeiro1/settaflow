import protheusApi from './protheusApi'

export const authService = {
  async login(username, password) {
    const { data } = await protheusApi.post(
      '/rest/STWS023P/',
      { cUser: username, cSenha: password },
      { auth: { username, password } }
    )
    const granted = data?.sucesso === true || data?.sucesso === 'true' || data?.sucesso === 1
    if (!data || !granted) {
      const err = new Error(data?.mensagem || 'Acesso negado')
      err.response = { status: 403 }
      err.apiMessage = data?.mensagem || null
      throw err
    }
    return data
  },

  async getUsuarios() {
    const { data } = await protheusApi.get('/rest/STWS023G/listar/')
    return Array.isArray(data) ? data : (data.usuarios || data.dados || data.resultado || [])
  },
}
