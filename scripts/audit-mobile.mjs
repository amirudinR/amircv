/**
 * Mobile ergonomics audit, driven straight over the Chrome DevTools Protocol.
 *
 * The contrast audit is arithmetic and lives in audit-contrast.mjs. This one
 * needs real layout, so it runs in a real engine. What it checks are the things
 * a screenshot at a single width cannot tell you: horizontal overflow, tap
 * target size, whether the header controls still fit now the theme toggle
 * shares the bar, and whether any element clips its own text.
 *
 * It talks CDP directly rather than through the agent-browser CLI, for two
 * reasons: every browser call is a fresh process launch (so nothing can wedge
 * and leave a session behind), and Node's own WebSocket is already here, which
 * keeps the project at zero dependencies.
 *
 * Usage: node scripts/audit-mobile.mjs [url] [width] [height] [theme]
 *        node scripts/audit-mobile.mjs --shots
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = [
  join(process.env.ProgramFiles ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env['ProgramFiles(x86)'] ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
].find((p) => p && existsSync(p))

if (!CHROME) {
  console.error('No Chrome/Edge binary found.')
  process.exit(1)
}

const url = process.argv[2] ?? 'http://localhost:5199/'
const width = Number(process.argv[3] ?? 390)
const height = Number(process.argv[4] ?? 844)
const theme = process.argv[5] ?? 'light'

/* ------------------------------------------------------------------ *
 * A page function run in the browser. Returns a plain object.
 * ------------------------------------------------------------------ */
const PAGE_AUDIT = `(() => {
  const doc = document.documentElement

  // Refuse to audit anything that is not the app. A dead dev server renders
  // Chrome's own error page, which happens to pass most of these checks — it
  // has no overflow, no small targets, and a clean header. Without this guard
  // a stopped server reports "no problems" and looks like a passing run.
  if (location.protocol === 'chrome-error:' || !document.getElementById('root')) {
    return {
      fatal: 'dev server unreachable: ' + (document.body.innerText.split('\\n')[0] || location.href),
    }
  }
  if (!doc.querySelector('header')) {
    return { fatal: 'app mounted but rendered no header; React likely threw' }
  }

  const problems = []
  const note = (kind, detail, node) => problems.push({ kind, detail, node: node || '' })

  // 1. Horizontal overflow: content is off-canvas.
  const overflowBy = doc.scrollWidth - doc.clientWidth
  if (overflowBy > 1) {
    const guilty = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1)
      })
      .slice(0, 8)
      .map((el) => {
        const r = el.getBoundingClientRect()
        const cls = (el.className || '').toString().split(' ')[0]
        return el.tagName.toLowerCase() + (cls ? '.' + cls : '') +
          ' right=' + Math.round(r.right) + ' left=' + Math.round(r.left)
      })
    note('overflow-x', overflowBy + 'px past viewport', guilty.join(' | '))
  }

  // 2. Tap targets, reported at two levels.
  //    WCAG 2.2 SC 2.5.8 (AA) asks for 24x24 CSS px and is a genuine failure
  //    below that. 44x44 is the older AAA figure and the comfortable thumb
  //    target, which is a preference rather than a defect — conflating the two
  //    buries real breakage under a list of merely-unhelpful targets.
  //    Inline links in prose are exempt: the text is the target and padding
  //    them wrecks the measure.
  const tooSmall = []
  const cramped = []
  document.querySelectorAll('a, button, input, select, [role="button"]').forEach((el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return
    if (el.closest('[inert]')) return
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return
    if (el.closest('p, address, figcaption, label')) return
    const describe =
      el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] +
      ' ' + Math.round(r.width) + 'x' + Math.round(r.height) +
      ' "' + (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24) + '"'
    if (r.width < 24 || r.height < 24) tooSmall.push(describe)
    else if (r.width < 44 || r.height < 44) cramped.push(describe)
  })
  if (tooSmall.length) note('tap-target-aa', tooSmall.length + ' under 24px', tooSmall.join(' | '))
  if (cramped.length) {
    note('tap-target-comfort', cramped.length + ' under 44px (passes AA, not comfortable)',
      cramped.join(' | '))
  }

  // 3. Header row: does it fit, and are the controls distinguishable?
  const header = document.querySelector('header')
  if (header) {
    const inner = header.querySelector('nav')
    const kids = [...inner.children].filter((el) => {
      const cs = getComputedStyle(el)
      return cs.display !== 'none' && el.getBoundingClientRect().width > 0
    })
    const right = Math.max(...kids.map((el) => el.getBoundingClientRect().right))
    if (right > doc.clientWidth + 1) {
      note('header-overflow', 'controls reach ' + Math.round(right) + 'px', '')
    }
    const sorted = kids.slice().sort(
      (a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left,
    )
    for (let i = 1; i < sorted.length; i += 1) {
      const gap = sorted[i].getBoundingClientRect().left - sorted[i - 1].getBoundingClientRect().right
      if (gap > -0.5 && gap < 8) {
        note('header-gap', Math.round(gap) + 'px between controls',
          sorted[i].className.toString().split(' ')[0])
      }
    }
  }

  // 4. Body measure: past ~95ch a line is hard to find the end of.
  const prose = [...document.querySelectorAll('p')].find((p) => p.textContent.trim().length > 120)
  if (prose) {
    const size = parseFloat(getComputedStyle(prose).fontSize)
    const chars = prose.getBoundingClientRect().width / (size * 0.5)
    if (chars > 95) note('measure', Math.round(chars) + 'ch wide', prose.className.toString())
  }

  // 5. Text clipped by a fixed-height box. Two exclusions, both deliberate:
  //    visually-hidden helpers (clipping off-screen text is how they work) and
  //    line-clamped text (truncation is the point, and it reports as
  //    scrollHeight > clientHeight by design).
  const isVisuallyHidden = (el) => {
    const cs = getComputedStyle(el)
    if (cs.clipPath && cs.clipPath !== 'none') return true
    if (cs.clip && cs.clip !== 'auto') return true
    const r = el.getBoundingClientRect()
    return r.width <= 2 || r.height <= 2
  }
  const isLineClamped = (el) => {
    const n = getComputedStyle(el).webkitLineClamp
    return Boolean(n) && n !== 'none'
  }
  const clipped = []
  document.querySelectorAll('h1, h2, h3, p, li, a, button, span').forEach((el) => {
    const cs = getComputedStyle(el)
    if (cs.overflow !== 'hidden' && cs.overflowY !== 'hidden') return
    if (el.clientHeight <= 0) return
    if (isVisuallyHidden(el) || isLineClamped(el)) return
    if (el.scrollHeight > el.clientHeight + 2) {
      clipped.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0])
    }
  })
  if (clipped.length) {
    note('clipped', clipped.length + ' elements clip their text',
      [...new Set(clipped)].slice(0, 6).join(' | '))
  }

  return {
    theme: doc.dataset.theme,
    viewport: doc.clientWidth + 'x' + doc.clientHeight,
    scrollWidth: doc.scrollWidth,
    problems,
  }
})()`

/* ------------------------------------------------------------------ *
 * CDP plumbing
 * ------------------------------------------------------------------ */

async function launch() {
  const port = 9200 + Math.floor(Math.random() * 400)
  const profile = join(tmpdir(), `cv-audit-${port}`)
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--hide-scrollbars',
      // Kept on so the hero scene mounts exactly as it does in a real browser;
      // software rendering is slower but composites the same way.
      '--use-gl=angle',
      '--use-angle=swiftshader',
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  )

  // Wait for the debugging endpoint rather than sleeping a fixed amount.
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (res.ok) {
        const info = await res.json()
        return { child, port, wsUrl: info.webSocketDebuggerUrl, profile }
      }
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  child.kill()
  throw new Error('Chrome did not expose a debugging endpoint')
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    let nextId = 1
    const pending = new Map()
    const sessionHandlers = new Map()

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id && pending.has(msg.id)) {
        const { resolve: done, reject: fail } = pending.get(msg.id)
        pending.delete(msg.id)
        if (msg.error) fail(new Error(msg.error.message))
        else done(msg.result)
        return
      }
      if (msg.method) {
        for (const handler of sessionHandlers.get(msg.sessionId ?? '') ?? []) handler(msg)
      }
    })
    ws.addEventListener('error', () => reject(new Error('CDP socket error')))
    ws.addEventListener('open', () =>
      resolve({
        send(method, params = {}, sessionId) {
          const id = nextId++
          const payload = { id, method, params }
          if (sessionId) payload.sessionId = sessionId
          return new Promise((done, fail) => {
            pending.set(id, { resolve: done, reject: fail })
            ws.send(JSON.stringify(payload))
          })
        },
        on(sessionId, handler) {
          const list = sessionHandlers.get(sessionId) ?? []
          list.push(handler)
          sessionHandlers.set(sessionId, list)
        },
        close: () => ws.close(),
      }),
    )
  })
}

/** Attach to a fresh tab, so a previous run's state cannot leak in. */
async function newPage(cdp) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send('Runtime.enable', {}, sessionId)

  /**
   * Navigate and wait for *this* navigation to finish.
   *
   * The load event has to be subscribed per navigation: a one-shot listener set
   * up at attach time is already spent by the first page load, so a second
   * `Page.navigate` would appear to finish instantly and the next evaluate
   * would run against the previous document. That is not a theoretical hazard —
   * it silently audits about:blank, which has an opaque origin and therefore
   * throws on localStorage.
   */
  const goto = async (target) => {
    const loaded = new Promise((resolve) => {
      cdp.on(sessionId, (msg) => {
        if (msg.method === 'Page.loadEventFired') resolve()
      })
    })
    await cdp.send('Page.navigate', { url: target }, sessionId)
    await loaded
  }

  return { sessionId, goto }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    sessionId,
  )
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'evaluate threw')
  }
  return result.result.value
}

/** Resolves once the network has been quiet for a moment. */
function waitForQuiet(cdp, sessionId, quietMs = 1200, capMs = 15000) {
  return new Promise((resolve) => {
    const started = Date.now()
    let last = Date.now()
    cdp.on(sessionId, (msg) => {
      if (msg.method === 'Network.loadingFinished' || msg.method === 'Network.loadingFailed') {
        last = Date.now()
      }
    })
    cdp.send('Network.enable', {}, sessionId).catch(() => {})
    const tick = setInterval(() => {
      const now = Date.now()
      if (now - last > quietMs || now - started > capMs) {
        clearInterval(tick)
        resolve()
      }
    }, 200)
  })
}

async function shoot(cdp, sessionId, path) {
  const { data } = await cdp.send(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: false },
    sessionId,
  )
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, Buffer.from(data, 'base64'))
  return path
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

const wantsShots = process.argv.includes('--shots')
const shotDir = join(process.cwd(), 'artifacts', 'audit')

const { child, port, wsUrl, profile } = await launch()
const cdp = await connect(wsUrl)

try {
  const { sessionId, goto } = await newPage(cdp)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: width < 768,
  }, sessionId)

  // The theme has to be in place before the app boots to be representative, so
  // it is seeded through the same storage key the app reads and then the page
  // is reloaded. about:blank is useless here: it is an opaque origin, so
  // localStorage writes to it are discarded.
  // The theme is driven by emulating the OS preference rather than by writing
  // storage. That is the honest test of the default path — the site follows
  // `prefers-color-scheme` until the user overrides it — and it sidesteps the
  // fact that headless Chrome refuses localStorage on this origin.
  const features = [{ name: 'prefers-color-scheme', value: theme }]
  if (process.argv.includes('--reduced')) {
    features.push({ name: 'prefers-reduced-motion', value: 'reduce' })
  }
  await cdp.send('Emulation.setEmulatedMedia', { features }, sessionId)

  await goto(url)
  await waitForQuiet(cdp, sessionId)
  // One more beat for the lazy WebGL chunk and the reveal observer.
  await sleep(2500)

  const report = await evaluate(cdp, sessionId, PAGE_AUDIT)
  if (report.fatal) {
    console.error(`FATAL: ${report.fatal}`)
    process.exitCode = 1
  } else {
    console.log(JSON.stringify(report, null, 2))
  }

  if (wantsShots) {
    mkdirSync(shotDir, { recursive: true })
    const tag = `${width}-${theme}`

    // Force a full repaint before capturing. Headless Chrome composites reveal
    // transitions onto their own layers, and a screenshot taken mid-transition
    // can come back with stale tiles — which reads convincingly as overlapping
    // text that the DOM geometry then refuses to confirm. Nudging opacity by a
    // hair invalidates those layers without changing anything visible.
    await evaluate(
      cdp,
      sessionId,
      `(() => { document.body.style.opacity = '0.999'; return 1 })()`,
    )
    await sleep(400)
    await evaluate(cdp, sessionId, `(() => { document.body.style.opacity = ''; return 1 })()`)
    await sleep(900)

    await shoot(cdp, sessionId, join(shotDir, `${tag}-top.png`))
    // Scroll to the first sections so the shots are not all the hero.
    for (const [name, selector] of [
      ['about', '#about'],
      ['projects', '#projects'],
      ['press', '#press'],
      ['contact', '#contact'],
    ]) {
      await evaluate(
        cdp,
        sessionId,
        `document.querySelector('${selector}')?.scrollIntoView({behavior:'instant',block:'start'}); 1`,
      )
      await sleep(1200)
      await shoot(cdp, sessionId, join(shotDir, `${tag}-${name}.png`))
    }
    console.log(`\nscreenshots -> ${shotDir}`)
  }
} finally {
  cdp.close()
  child.kill()
}
