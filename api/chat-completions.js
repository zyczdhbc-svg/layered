/**
 * Same-origin proxy for ai-gateway-test.xtool.com chat completions.
 * Browser calls /api/chat-completions so Authorization is not blocked by CORS.
 */
export const config = {
  // Hobby 套餐最高 60s；更长请求需 Pro（见 Vercel Functions duration）
  maxDuration: 60,
}

const TARGET_URL = 'https://ai-gateway-test.xtool.com/v1/chat/completions'

export default async function handler(req, res) {
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
    upstream = await fetch(TARGET_URL, init)
  } catch (e) {
    return res.status(502).json({ error: String(e?.message || e) })
  }

  const contentType = upstream.headers.get('content-type')
  if (contentType) res.setHeader('content-type', contentType)

  const body = Buffer.from(await upstream.arrayBuffer())
  return res.status(upstream.status).send(body)
}
