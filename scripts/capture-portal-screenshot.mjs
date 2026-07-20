/**
 * Regenerates the landing-page hero image (src/assets/portal-screenshot.webp)
 * from the REAL portal UI, so the marketing site never shows a fabricated mock.
 *
 * Usage:
 *   node scripts/capture-portal-screenshot.mjs <portal-url> [out-path]
 *
 * <portal-url> is a live /portal/<token> link — the "Onboarding — Acme Ltd"
 * demo request seeded on the test account exists for exactly this purpose.
 * Requires Google Chrome installed (uses puppeteer-core, no bundled browser).
 */
import puppeteer from 'puppeteer-core'

const [, , url, outPath = 'src/assets/portal-screenshot.webp'] = process.argv
if (!url) {
  console.error('Usage: node scripts/capture-portal-screenshot.mjs <portal-url> [out-path]')
  process.exit(1)
}

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 920, height: 1500, deviceScaleFactor: 2 })

  // Pre-seed cookie consent (rejected) so the banner does not cover the shot.
  await page.goto(new URL(url).origin, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.setItem(
      'bdg-cookie-consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        decidedAt: new Date().toISOString(),
        version: 1,
      }),
    )
  })

  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.portal__list', { timeout: 20000 })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 500))

  // Clip from the page title to the bottom of the documents card, hugging the
  // content column (the app header is cropped out — the hero adds its own
  // browser-window frame).
  const clip = await page.evaluate(() => {
    const list = document.querySelector('.portal__list').getBoundingClientRect()
    const welcome = document.querySelector('.portal__welcome').getBoundingClientRect()
    const left = Math.min(list.left, welcome.left)
    const right = Math.max(list.right, welcome.right)
    const top = window.scrollY + welcome.top - 8
    return {
      x: window.scrollX + left - 16,
      y: top,
      width: right - left + 32,
      height: window.scrollY + list.bottom + 8 - top,
    }
  })
  await page.screenshot({ path: outPath, clip, captureBeyondViewport: true, type: 'webp', quality: 92 })
  console.log('saved', outPath, JSON.stringify(clip))
  console.log('If the crop size changed, update the width/height attributes on .mock__img in LandingView.vue.')
} finally {
  await browser.close()
}
