/**
 * Post-build prerendering for the public marketing routes.
 *
 * Serves dist/ over a local HTTP server, loads each route in headless Chrome
 * (system-installed — puppeteer-core downloads nothing), and writes the fully
 * rendered HTML back into dist/ so crawlers and social scrapers get real
 * content with per-route <head> tags. The SPA hydrates over it as usual.
 *
 * SOFT-FAIL BY DESIGN: any error (no Chrome on the machine, timeout, …) logs
 * a warning and exits 0 — the deploy then simply ships the plain CSR build.
 */
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'

const DIST = resolve(process.cwd(), 'dist')
const ROUTES = [
  '/',
  '/pricing',
  '/guides/how-to-collect-documents-from-clients',
  '/guides/new-client-onboarding-document-checklist',
  '/guides/secure-alternatives-to-email-attachments',
  '/legal/terms',
  '/legal/privacy',
  '/legal/dpa',
  '/legal/cookies',
]

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml',
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    // Windows
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    // Linux (GitHub Actions runners ship google-chrome)
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)
  return candidates.find((p) => existsSync(p))
}

function serveDist() {
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname
      let file = join(DIST, path)
      if (!extname(file)) file = join(DIST, 'index.html') // SPA fallback
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)))
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.warn('[prerender] dist/index.html not found — run vite build first. Skipping.')
    return
  }
  // Always keep a pristine (un-prerendered) copy of the app shell. vercel.json
  // rewrites unknown paths to /_shell.html so a bad URL renders the neutral
  // shell (then the client 404) instead of flashing prerendered landing
  // content. Written before the Chrome check so the rewrite target exists even
  // when prerendering soft-fails.
  await writeFile(join(DIST, '_shell.html'), await readFile(join(DIST, 'index.html')))
  const chrome = findChrome()
  if (!chrome) {
    console.warn('[prerender] No Chrome/Edge found on this machine — skipping (CSR build ships as-is).')
    return
  }

  const { default: puppeteer } = await import('puppeteer-core')
  const server = await serveDist()
  const port = server.address().port
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  })

  try {
    const page = await browser.newPage()
    const rendered = new Map()
    for (const route of ROUTES) {
      await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle0', timeout: 30000 })
      // The app is mounted once the router view has rendered something.
      await page.waitForSelector('#app main, #app .landing', { timeout: 15000 })
      rendered.set(route, '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML)))
      console.log(`[prerender] captured ${route}`)
    }
    // Write only after every route rendered, so the SPA fallback that the
    // local server uses stays pristine during capture.
    for (const [route, html] of rendered) {
      const out = route === '/' ? join(DIST, 'index.html') : join(DIST, route.slice(1), 'index.html')
      await mkdir(dirname(out), { recursive: true })
      await writeFile(out, html)
    }
    console.log(`[prerender] done — ${rendered.size} routes written.`)
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((err) => {
  console.warn(`[prerender] Failed (${err.message}) — skipping, CSR build ships as-is.`)
  process.exitCode = 0
})
