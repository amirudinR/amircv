/**
 * One-off page probe over CDP. Loads the URL, waits, then evaluates an
 * expression and prints the result. Used to check live state that a static
 * audit cannot see.
 *
 * Usage: node scripts/probe.mjs <url> [width] [height] [scheme] "<expression>"
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = [
  join(process.env.ProgramFiles ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env['ProgramFiles(x86)'] ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
].find((p) => p && existsSync(p))

const url = process.argv[2]
const width = Number(process.argv[3] ?? 390)
const height = Number(process.argv[4] ?? 844)
const scheme = process.argv[5] ?? 'light'
const expression = process.argv[6] ?? '1'

const port = 9600 + Math.floor(Math.random() * 300)
const profile = join(tmpdir(), `cv-probe-${port}`)

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
    if (m.method) handlers.forEach((h) => h(m))
  })
  ws.addEventListener('error', reject)
  ws.addEventListener('open', async () => {
    const send = (method, params = {}, sessionId) =>
      new Promise((done, fail) => {
        const n = id++
        pending.set(n, { resolve: done, reject: fail })
        ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }))
      })

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    await send('Page.enable', {}, sessionId)
    await send('Runtime.enable', {}, sessionId)
    await send(
      'Emulation.setEmulatedMedia',
      { features: [{ name: 'prefers-color-scheme', value: scheme }] },
      sessionId,
    )
    await send(
      'Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 2, mobile: width < 768 },
      sessionId,
    )

    const loaded = new Promise((r) => {
      handlers.push((m) => {
        if (m.method === 'Page.loadEventFired') r()
      })
    })
    await send('Page.navigate', { url }, sessionId)
    await loaded
    await sleep(4000)

    // Optional scroll target. getBoundingClientRect is viewport-relative, so
    // measuring an element without scrolling reports its position relative to
    // the top of an unvisited document — which is not where the user sees it.
    const scrollTo = process.argv[7]
    if (scrollTo) {
      await send(
        'Runtime.evaluate',
        {
          expression: `document.querySelector('${scrollTo}')?.scrollIntoView({behavior:'instant',block:'center'}); 1`,
        },
        sessionId,
      )
      await sleep(2500)
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
    ws.close()
    resolve()
  })
})

chrome.kill()
