/**
 * Contrast audit for the two themes.
 *
 * Run: node scripts/audit-contrast.mjs
 *
 * Reads the token values straight out of global.css rather than trusting a
 * screenshot. A contrast ratio is arithmetic, so the arithmetic is checked
 * directly; what a screenshot cannot tell you is a token that is never
 * referenced, or a literal in a module that quietly ignores the palette.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const lin = (v) => {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => {
  const l1 = lum(a)
  const l2 = lum(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const hexToRgb = (hex) => {
  const h = hex.trim().replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

/** Pull `--name: value;` pairs out of one selector block. */
function tokensFrom(css, selector) {
  const start = css.indexOf(selector)
  if (start === -1) return null
  const open = css.indexOf('{', start)
  let depth = 0
  let end = open
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const body = css.slice(open + 1, end)
  const out = {}
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

const globalCss = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8')
const light = tokensFrom(globalCss, ':root')
const dark = tokensFrom(globalCss, "[data-theme='dark']")

if (!light || !dark) {
  console.error('Could not locate both token blocks in global.css')
  process.exit(1)
}

/** Only solid hex tokens are checked. Alpha composites (`--border`, the ink
 *  hairlines) are decoration rather than text, and `--paper-*` are SVG data
 *  URIs rather than colours at all. */
const resolve = (tokens, name) => {
  const v = tokens[name]
  return v && /^#[0-9a-f]{3,8}$/i.test(v) ? hexToRgb(v) : null
}

/**
 * Pairs that actually appear together on screen. `surface` is listed against
 * `text`/`accent` because cards sit on it; `bg-deep` is the scrollbar track and
 * the recessed wells.
 */
const PAIRS = [
  ['text', 'bg', 4.5, 'body copy on the sheet'],
  ['text-muted', 'bg', 4.5, 'muted copy + mono labels on the sheet'],
  ['text-muted', 'surface', 4.5, 'muted copy inside a card'],
  ['accent', 'bg', 4.5, 'eyebrow + active nav link'],
  ['accent', 'surface', 4.5, 'active nav link over a card'],
  ['accent', 'bg-deep', 4.5, 'accent on a recessed well'],
  ['ink', 'bg', 4.5, 'headings'],
  ['ink', 'surface', 4.5, 'headings inside a card'],
  ['ink-soft', 'bg', 4.5, 'role line + logo'],
  ['ink-soft', 'surface', 4.5, 'role line inside a card'],
  ['highlight', 'selection-ink', 4.5, 'selected text'],
  ['scene-stain', 'bg', 3, 'stamp + scene stain, non-text'],
  ['accent-2', 'bg', 4.5, 'secondary accent'],
  ['accent-3', 'bg', 4.5, 'tertiary accent'],
  ['ink', 'bg-deep', 4.5, 'skip link text on its own plate'],
  ['bg', 'ink', 4.5, 'skip link plate against page'],
]

let failures = 0
for (const [label, tokens] of [
  ['light', light],
  ['dark', dark],
]) {
  console.log(`\n=== ${label} ===`)
  for (const [fgName, bgName, need, why] of PAIRS) {
    const fg = resolve(tokens, fgName)
    const bg = resolve(tokens, bgName)
    if (!fg || !bg) {
      console.log(`  ?  ${fgName} on ${bgName} — non-hex token, skipped`)
      continue
    }
    const got = ratio(fg, bg)
    const ok = got >= need
    if (!ok) failures += 1
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${got.toFixed(2).padStart(5)}:1  (need ${need})  ${fgName} on ${bgName}  — ${why}`,
    )
  }
}

/** Every token declared in one block but missing from the other is a smell. */
const missing = Object.keys(light).filter((k) => !(k in dark))
if (missing.length) {
  console.log(`\nTokens in :root but not in [data-theme='dark']: ${missing.join(', ')}`)
}

console.log(failures === 0 ? '\nAll pairs pass.' : `\n${failures} pair(s) below target.`)
process.exit(failures === 0 ? 0 : 1)
