// Serves the production build the way Vercel does, for Lighthouse runs:
// prerendered pages and assets come straight from `.output/public` (with the same
// cache and security headers), everything else falls through to the Nitro server, and
// every compressible response is brotli-encoded like Vercel's CDN.
//
// Usage: pnpm build && node scripts/serve-prod.mjs   (PORT defaults to 4173)
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import http from 'node:http'
import { extname, join, normalize } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

import { securityHeaders } from '../src/lib/security-headers.ts'

const PORT = Number(process.env.PORT ?? 4173)
const NITRO_PORT = PORT + 1
const PUBLIC_DIR = join(import.meta.dirname, '..', '.output', 'public')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}
const COMPRESSIBLE = /^(text\/|application\/(json|javascript)|image\/svg)/

function cacheControl(pathname) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (extname(pathname) === '.html') return 'public, max-age=0, must-revalidate'
  return 'public, max-age=86400'
}

function resolveStatic(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '')
  for (const candidate of [safe, join(safe, 'index.html')]) {
    const file = join(PUBLIC_DIR, candidate)
    if (file.startsWith(PUBLIC_DIR) && existsSync(file) && statSync(file).isFile()) return file
  }
  return null
}

function send(req, res, status, headers, body) {
  const type = String(headers['content-type'] ?? '')
  if (COMPRESSIBLE.test(type) && /\bbr\b/.test(req.headers['accept-encoding'] ?? '')) {
    body = brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })
    headers['content-encoding'] = 'br'
    headers.vary = 'accept-encoding'
  }
  delete headers['transfer-encoding']
  headers['content-length'] = body.length
  res.writeHead(status, headers)
  res.end(body)
}

const nitro = spawn(process.execPath, [join(PUBLIC_DIR, '..', 'server', 'index.mjs')], {
  env: { ...process.env, PORT: String(NITRO_PORT), HOST: '127.0.0.1' },
  stdio: 'inherit',
})
process.on('exit', () => nitro.kill())
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(0))

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost')
    const file = req.method === 'GET' || req.method === 'HEAD' ? resolveStatic(pathname) : null

    if (file) {
      const headers = {
        ...securityHeaders(),
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
        'cache-control': cacheControl(file.endsWith('index.html') ? '/index.html' : pathname),
      }
      return send(req, res, 200, headers, readFileSync(file))
    }

    const upstream = http.request(
      {
        host: '127.0.0.1',
        port: NITRO_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (upstreamRes) => {
        const chunks = []
        upstreamRes.on('data', (chunk) => chunks.push(chunk))
        upstreamRes.on('end', () =>
          send(
            req,
            res,
            upstreamRes.statusCode ?? 502,
            { ...upstreamRes.headers },
            Buffer.concat(chunks),
          ),
        )
      },
    )
    upstream.on('error', () =>
      send(req, res, 502, { 'content-type': 'text/plain' }, Buffer.from('Bad gateway')),
    )
    req.pipe(upstream)
  })
  .listen(PORT, () => console.log(`Serving production build at http://localhost:${PORT}`))
