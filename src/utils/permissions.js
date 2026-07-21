// Usuários com acesso ao módulo Jurídico (Dashboard, Minha Fila, Contratos).
// Comparação case-insensitive pra não depender de como o Protheus retorna o login.
const JURIDICO_ALLOWED_USERS = ['lucas.ribeiro', 'bibiane.oliveira', 'rodrigo.padilha']

export function canAccessJuridico(user) {
  const username = String(user?.username || '').toLowerCase()
  return JURIDICO_ALLOWED_USERS.some((u) => u.toLowerCase() === username)
}
