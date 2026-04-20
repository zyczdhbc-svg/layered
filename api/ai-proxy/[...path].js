/**
 * Same-origin proxy for ai-gateway-test.xtool.com (Vercel serverless).
 * Browser calls /api/ai-proxy/v1/... so Authorization is not blocked by CORS.
 */
export const config = {
  // Hobby 套餐最高 60s；更长请求需 Pro（见 Vercel Functions duration）
  maxDuration: 60,
}

export default async function handler(req, res) {
  const raw = req.query.path
  const segments = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [String(raw)] : []
  const pathSuffix = segments.length ? `/${segments.join('/')}` : ''
  const url = new URL(req.url || '/', 'http://localhost')
  const dest = `https://ai-gateway-test.xtool.com${pathSuffix}${url.search}`

  const headers = new Headers()
  if (req.headers.authorization) {
    headers.set('authorization', req.headers.authorization)
  }
  if (req.headers['content-type']) {
    headers.set('content-type', req.headers['content-type'])
  }
  if (req.headers.accept) {
    headers.set('accept', req.headers.accept)
  }

  const init = {
    method: req.method,
    headers,
    redirect: 'manual',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (typeof req.body === 'string') {
      init.body = req.body
    } else if (req.body != null) {
      init.body = JSON.stringify(req.body)
    }
  }

  let upstream
  try {
    upstream = await fetch(dest, init)
  } catch (e) {
    return res.status(502).json({ error: String(e?.message || e) })
  }

  const ct = upstream.headers.get('content-type')
  if (ct) res.setHeader('content-type', ct)

  const buf = Buffer.from(await upstream.arrayBuffer())
  return res.status(upstream.status).send(buf)
}
