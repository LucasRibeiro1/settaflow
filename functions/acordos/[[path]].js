import { proxyToProtheus } from '../_shared/proxy.js'

// Encaminha /acordos/* -> http://177.85.6.66:8089/rest/* (equivalente ao rewrite do vercel.json)
export async function onRequest({ request, params }) {
  return proxyToProtheus(request, params, {
    baseUrl: 'http://177.85.6.66:8089',
    prefix: '/rest',
  })
}
