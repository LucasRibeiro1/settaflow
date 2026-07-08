// Encaminha a requisição recebida na Cloudflare Pages Function para o servidor
// Protheus (HTTP puro), preservando método, auth, corpo e query string — evitando
// que o navegador chame o IP HTTP diretamente (o que seria bloqueado por mixed content).
export async function proxyToProtheus(request, params, { baseUrl, prefix }) {
  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : [])
  const path = segments.join('/')
  const url = new URL(request.url)

  const target = `${baseUrl}${prefix}/${path}${url.search}`

  const headers = new Headers()
  const auth = request.headers.get('authorization')
  const contentType = request.headers.get('content-type')
  if (auth) headers.set('authorization', auth)
  if (contentType) headers.set('content-type', contentType)

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
