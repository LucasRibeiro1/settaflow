import { proxyToProtheus } from '../_shared/proxy.js'

// Encaminha /rest/* -> https://api.gruposetta.com.br/rest01/*
// Usa hostname (em vez do IP puro) porque a Cloudflare bloqueia fetch()
// direto pra IP com o erro 1003 (Direct IP Access Not Allowed).
export async function onRequest({ request, params }) {
  return proxyToProtheus(request, params, {
    baseUrl: 'https://api.gruposetta.com.br',
    prefix: '/rest01',
  })
}
