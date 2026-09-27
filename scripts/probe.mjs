/**
 * One-off page probe over CDP. Loads the URL, waits, then evaluates an
 * expression and prints the result, along with any errors the page logged and
 * WebGL draw-call counts. Used to check live state that a static audit cannot
 * see.
 *
 * Usage:
 *   node scripts/probe.mjs <url> [width] [height] [scheme] "<expression>" \
 *     [scrollToSelector] [waitForSelector] [screenshotPath]
 *
 * Flags anywhere in argv:
 *   --nowebgl  pretend the browser has no WebGL, by making getContext return
 *              null for webgl types before the document loads. This is the only
 *              honest way to test the no-WebGL path: a flag in the app would be
 *              a different code path from the capability probe that actually
 *              runs in the wild.
 *   --reduced  emulate prefers-reduced-motion: reduce
 *
 * Set PROBE_TRACE=1 to log each CDP call as it goes out.
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = [
  join(process.env.ProgramFiles ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env['ProgramFiles(x86)'] ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
].find((p) => p && existsSync(p))

// Positional arguments, with flags filtered out. Reading argv[7] directly meant
// passing `--reduced` in the wrong place silently turned it into a "wait for
// this selector" argument, which then reported the flag as a missing element.
const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))

const url = positional[0]
const width = Number(positional[1] ?? 390)
const height = Number(positional[2] ?? 844)
const scheme = positional[3] ?? 'light'
const expression = positional[4] ?? '1'
const noWebgl = process.argv.includes('--nowebgl')
const reduced = process.argv.includes('--reduced')

const port = 9600 + Math.floor(Math.random() * 300)
const profile = join(tmpdir(), `cv-probe-${port}`)

// A wedged probe that only ends when the shell gives up is worse than one that
// says so. Chrome is killed on the way out either way.
const watchdog = setTimeout(() => {
  console.error(`probe: no result within 90s (port ${port})`)
  try {
    chrome.kill()
  } catch {
    /* already gone */
  }
  process.exit(1)
}, 90_000)
watchdog.unref?.()

const chrome = spawn(
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
    '--use-gl=angle',
    '--use-angle=swiftshader',
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

async function endpoint() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (res.ok) return (await res.json()).webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error('no debugging endpoint')
}

const wsUrl = await endpoint()

await new Promise((resolve, reject) => {
  const ws = new WebSocket(wsUrl)
  let id = 1
  const pending = new Map()
  const handlers = []

  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      const { resolve: done, reject: fail } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? fail(new Error(m.error.message)) : done(m.result)
      return
    }
    if (!m.method) return
    handlers.forEach((h) => m)
  })
  ws.addEventListener('error', reject)
  ws.addEventListener('open', async () => {
    // A rejected CDP call inside this listener would otherwise leave the outer
    // promise unsettled, and the probe would report a timeout instead of the
    // real cause.
    try {
      await drive()
    } catch (err) {
      console.error(`probe failed: ${err?.stack ?? err}`)
      try {
        ws.close()
      } catch {
        /* already closed */
      }
      resolve()
    }

    async function drive() {
    const send = (method, params = {}, sessionId) =>
      new Promise((done, fail) => {
        const n = id++
        if (process.env.PROBE_TRACE) console.error(`> ${method} #${n}`)
        pending.set(n, { resolve: done, reject: fail })
        ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }))
      })

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    await send('Page.enable', {}, sessionId)

    // Errors are collected *inside the page* rather than over the protocol. A
    // component that throws every frame emits thousands of
    // `Runtime.exceptionThrown` events, which floods the socket hard enough to
    // wedge the probe before it can report anything. Reading a page-side buffer
    // at the end costs one round trip and cannot deadlock.
    await send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source: `
          (() => {
            ${
              noWebgl
                ? `
            // Before anything else, so the app's own capability probe sees the
            // same thing a driver-less machine would.
            const realGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
              if (typeof type === 'string' && type.toLowerCase().includes('webgl')) return null;
              return realGetContext.call(this, type, ...rest);
            };`
                : ''
            }
            const cap = 40;
            window.__errs = [];
            const note = (s) => { if (window.__errs.length < cap) window.__errs.push(String(s).slice(0, 900)); };
            addEventListener('error', (e) => note('ERROR ' + (e.error && e.error.stack ? e.error.stack : e.message)), true);
            addEventListener('unhandledrejection', (e) => note('REJECT ' + (e.reason && e.reason.stack ? e.reason.stack : e.reason)));
            for (const level of ['error', 'warn']) {
              const orig = console[level].bind(console);
              console[level] = (...a) => { note(level.toUpperCase() + ' ' + a.map((x) => (x && x.stack ? x.stack : String(x))).join(' ')); orig(...a); };
            }
            // Draw-call spy. A canvas that is mounted, has a live context and
            // still shows nothing is either not drawing or drawing nothing, and
            // gl.info is not reachable from the page. Counting the draw calls
            // settles which, without guessing.
            window.__gl = { draws: 0, verts: 0, lastVp: null, cleared: 0, programs: 0 };
            for (const proto of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
              if (!proto) continue;
              for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
                const orig = proto.prototype[name];
                if (!orig) continue;
                proto.prototype[name] = function (...a) { window.__gl.draws += 1; window.__gl.verts += a[1] ?? 0; return orig.apply(this, a); };
              }
              const vp = proto.prototype.viewport;
              proto.prototype.viewport = function (x, y, w, h) { window.__gl.lastVp = [x, y, w, h]; return vp.call(this, x, y, w, h); };
              const cl = proto.prototype.clearColor;
              proto.prototype.clearColor = function (r, g, b, a) { window.__gl.cleared = [r, g, b, a]; return cl.call(this, r, g, b, a); };
            }
          })();
        `,
      },
      sessionId,
    )
    await send(
      'Emulation.setEmulatedMedia',
      {
        features: [
          { name: 'prefers-color-scheme', value: scheme },
          ...(reduced ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []),
        ],
      },
      sessionId,
    )
    await send(
      'Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 2, mobile: width < 768 },
      sessionId,
    )

    const loaded = new Promise((r) => {
      handlers.push((m) => {
        if (m.method === 'Page.loadEventFired') r('load')
      })
    })
    await send('Page.navigate', { url }, sessionId)
    // Raced, not awaited: a page that never fires `load` — a pending module, a
    // font request that hangs — used to wedge the whole probe. The expression
    // still runs, and `document.readyState` in the result says what happened.
    const outcome = await Promise.race([loaded, sleep(15_000).then(() => 'timeout')])
    if (process.env.PROBE_TRACE) console.error(`< navigate ${outcome}`)
    await sleep(4000)

    // Optional scroll target. getBoundingClientRect is viewport-relative, so
    // measuring an element without scrolling reports its position relative to
    // the top of an unvisited document — which is not where the user sees it.
    const scrollTo = positional[5]
    if (scrollTo) {
      await send(
        'Runtime.evaluate',
        {
          expression: `document.querySelector('${scrollTo}')?.scrollIntoView({behavior:'instant',block:'center'}); 1`,
        },
        sessionId,
      )
      await sleep(1500)
    }

    // Optional wait-for selector. A fixed sleep is a guess, and a lazy scene is
    // exactly the thing that makes the guess wrong: Vite transforms a first-time
    // dependency like drei on demand, so the canvas can be seconds behind the
    // scroll. Polls instead, and reports whether it ever showed up.
    const waitFor = positional[6]
    if (waitFor) {
      let found = false
      for (let i = 0; i < 50 && !found; i += 1) {
        const r = await send(
          'Runtime.evaluate',
          { expression: `!!document.querySelector('${waitFor}')`, returnByValue: true },
          sessionId,
        )
        found = r.result?.value === true
        if (!found) await sleep(500)
      }
      if (process.env.PROBE_TRACE) console.error(`< waitFor ${waitFor}: ${found}`)
      if (!found) console.log(`NOTE: "${waitFor}" never appeared`)
      // Let the scene settle a few frames after it exists.
      await sleep(1500)
    }

    const res = await send(
      'Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true },
      sessionId,
    )
    console.log(
      res.exceptionDetails
        ? `EXCEPTION: ${res.exceptionDetails.exception?.description ?? res.exceptionDetails.text}`
        : JSON.stringify(res.result.value, null, 2),
    )

    // Optional screenshot, taken last so it shows the settled state rather than
    // whatever was on screen when the expression ran.
    const shot = positional[7]
    if (shot) {
      mkdirSync(dirname(shot), { recursive: true })
      const cap = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
      writeFileSync(shot, Buffer.from(cap.data, 'base64'))
      console.log(`\nscreenshot -> ${shot}`)
    }

    const errs = await send('Runtime.evaluate', { expression: 'window.__errs', returnByValue: true }, sessionId)
    const lines = errs.result?.value ?? []
    if (lines.length) {
      console.log('\n--- page errors ---')
      for (const line of lines) console.log(line)
    }

    ws.close()
    resolve()
    }
  })
})

chrome.kill()
