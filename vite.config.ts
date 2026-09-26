import { defineConfig, loadEnv } from 'vite'
import type { HtmlTagDescriptor, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

/* Canonical origin. Overridden by the SITE_URL env var (Vercel project
   settings / .env). Keep this the single hardcoded domain in the build. */
const DEFAULT_SITE_ORIGIN = 'https://amircv.vercel.app'

const SITE_URL_ENV_VARS = ['SITE_URL'] as const

/** Strip trailing slashes so joined paths never produce `//`. */
function normaliseOrigin(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '')
}

function resolveSiteOrigin(env: Record<string, string | undefined>): string {
  for (const key of SITE_URL_ENV_VARS) {
    const fromProcess = normaliseOrigin(process.env[key])
    if (fromProcess) return fromProcess
    const fromFile = normaliseOrigin(env[key])
    if (fromFile) return fromFile
  }
  return DEFAULT_SITE_ORIGIN
}

/* ------------------------------------------------------------------ *
 * Anchored manualChunks
 *
 * The previous `id.includes('three')` test also matched unrelated packages
 * such as `three-mesh-bvh`, and would swallow a scoped package merely
 * because of a substring hit. Match on the real `node_modules/<pkg>/`
 * path segment instead so only the intended packages are captured.
 * ------------------------------------------------------------------ */

const THREE_PACKAGES = new Set(['three', '@react-three/fiber', '@react-three/drei'])
const MOTION_PACKAGES = new Set(['gsap', 'lenis'])

/** Resolve the installed package name for a module id, or null. */
function packageNameOf(id: string): string | null {
  const segments = id.split(/[\\/]/)
  const nmIndex = segments.lastIndexOf('node_modules')
  if (nmIndex === -1) return null

  const name = segments[nmIndex + 1]
  if (!name || name === '.' || name === '..') return null

  // Scoped packages span two segments: node_modules/@scope/name/...
  if (name.startsWith('@')) {
    const scopedName = segments[nmIndex + 2]
    return scopedName ? `${name}/${scopedName}` : null
  }
  return name
}

function manualChunks(id: string): string | undefined {
  const pkg = packageNameOf(id)
  if (!pkg) return undefined
  if (THREE_PACKAGES.has(pkg)) return 'three'
  if (MOTION_PACKAGES.has(pkg)) return 'motion'
  return undefined
}

/* ------------------------------------------------------------------ *
 * Single-sourced site URL
 *
 * Rewrites the placeholder canonical / og:url in index.html and injects
 * the OG/Twitter image tags when they are missing. Runs in dev and build.
 * Idempotent: tags are only injected when absent, and attribute values
 * are replaced in place rather than appended.
 * ------------------------------------------------------------------ */

const TAG_RE = /<(?:link|meta)\b[^>]*>/gi

function hasTag(html: string, predicate: (tag: string) => boolean): boolean {
  for (const tag of html.match(TAG_RE) ?? []) {
    if (predicate(tag)) return true
  }
  return false
}

/** Set `attr="…"` inside a matched tag, regardless of attribute order. */
function setAttr(tag: string, attrName: 'href' | 'content', value: string): string {
  const attrRe = new RegExp(`(\\b${attrName}\\s*=\\s*)(["'])[^"']*\\2`, 'i')
  return tag.replace(attrRe, (_match, prefix: string, quote: string) => `${prefix}${quote}${value}${quote}`)
}

function siteUrlPlugin(origin: string): Plugin {
  const ogImage = `${origin}/og-image.png`

  return {
    name: 'cv:site-url',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const withCanonical = html.replace(TAG_RE, (tag) => {
          if (/\brel\s*=\s*["']canonical["']/i.test(tag)) return setAttr(tag, 'href', origin)
          if (/\bproperty\s*=\s*["']og:url["']/i.test(tag)) return setAttr(tag, 'content', origin)
          return tag
        })

        const tags: HtmlTagDescriptor[] = []
        if (!hasTag(withCanonical, (t) => /\bproperty\s*=\s*["']og:image["']/i.test(t))) {
          tags.push({
            tag: 'meta',
            attrs: { property: 'og:image', content: ogImage },
            injectTo: 'head',
          })
        }
        if (!hasTag(withCanonical, (t) => /\bname\s*=\s*["']twitter:image["']/i.test(t))) {
          tags.push({
            tag: 'meta',
            attrs: { name: 'twitter:image', content: ogImage },
            injectTo: 'head',
          })
        }

        return { html: withCanonical, tags }
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const origin = resolveSiteOrigin(loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), siteUrlPlugin(origin)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  }
})
