// Encaminha a requisição recebida na Cloudflare Pages Function para o servidor
// Protheus (HTTP puro), preservando método, auth, corpo e query string — evitando
// que o navegador chame o IP HTTP diretamente (o que seria bloqueado por mixed content).
export async function proxyToProtheus(request, params, { baseUrl, prefix }) {
  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : [])
  const path = segments.join('/')
  const url = new URL(request.url)

  const target = `${baseUrl}${prefix}/${path}${url.search}`

  // Repassa todos os headers originais (Accept, User-Agent, Authorization, etc.) —
  // exceto host/content-length, que precisam ser recalculados pro destino.
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ray')
  headers.delete('cf-visitor')

  const hasBody = !['GET', 'HEAD'].includes(request.method)

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  })

  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}
