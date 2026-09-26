/**
 * Theme resolution.
 *
 * One deliberate choice: the *stylesheet never reads
 * `prefers-color-scheme`*. If CSS had its own dark block keyed to the media
 * query and JavaScript set `data-theme` for the manual override, the two would
 * disagree whenever they ran out of sync — the classic "dark mode ignores my
 * toggle" bug. Instead `:root` is always light and `[data-theme='dark']` is the
 * only dark rule, so there is exactly one authority: this module.
 *
 * Because of that, `data-theme` has to be on the document before first paint or
 * the page renders a cream flash before turning dark. The inline script in
 * index.html mirrors the logic below and must be kept in step with it.
 */

import { useCallback, useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** Shared with the pre-paint script in index.html. */
export const THEME_STORAGE_KEY = 'marginalia:theme'

/** Matches the inline script's query string. */
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Browser-chrome tint per theme, so the address bar agrees with the sheet. */
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f4f0e6',
  dark: '#141210',
}

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'

/**
 * Storage throws rather than returning null in some privacy modes and when a
 * third-party context blocks it, and a theme is never worth a broken render.
 */
function readStoredPreference(): ThemePreference {
  try {
    const stored: unknown = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function writeStoredPreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* Preference lasts this session only; the site still works. */
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function resolve(preferred: ThemePreference): ResolvedTheme {
  return preferred === 'system' ? systemTheme() : preferred
}

/**
 * Reflect the theme onto the document. `color-scheme` is left to CSS
 * (`:root` / `[data-theme='dark']`), so this only owns the attribute, the
 * theme-color meta, and the pre-paint background the inline stylesheet cannot
 * compute on its own.
 */
function applyToDocument(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.dataset.theme = theme

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])

  // index.html hard-codes the cream sheet so there is no white flash before the
  // stylesheet arrives. That inline rule is equally hard-coded, so dark mode has
  // to overwrite it here or the first paint stays cream regardless of tokens.
  root.style.backgroundColor = THEME_COLORS[theme]
}

let preference: ThemePreference = 'system'
let resolved: ResolvedTheme = 'light'
const listeners = new Set<() => void>()

function publish(): void {
  for (const listener of listeners) listener()
}

function commit(next: ResolvedTheme): void {
  if (next === resolved) return
  resolved = next
  applyToDocument(next)
  publish()
}

export function setThemePreference(next: ThemePreference): void {
  preference = next
  writeStoredPreference(next)
  commit(resolve(next))
}

// Initialised at module evaluation, not from an effect: `/src/main.tsx` is a
// deferred module script, so the document already exists, and reading the theme
// during the first render means there is no paint with the wrong tokens. Doing
// it in an effect would leave exactly one frame of light theme.
if (typeof document !== 'undefined') {
  preference = readStoredPreference()
  resolved = resolve(preference)
  applyToDocument(resolved)
  window.matchMedia(DARK_QUERY).addEventListener('change', () => {
    if (preference === 'system') commit(systemTheme())
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): ResolvedTheme {
  return resolved
}

/** True when the theme on screen came from the OS rather than a choice. */
export function themeFollowsSystem(): boolean {
  return preference === 'system'
}

export interface ThemeControls {
  /** What is actually on screen. */
  theme: ResolvedTheme
  /** What the user asked for, which may be to defer to the OS. */
  preference: ThemePreference
  /** True when the theme on screen came from the OS rather than a choice. */
  followsSystem: boolean
  setPreference: (next: ThemePreference) => void
  /** Flip to the opposite of what is on screen, pinning the choice. */
  toggle: () => void
}

export function useTheme(): ThemeControls {
  const theme = useSyncExternalStore(subscribe, getSnapshot)

  const setPreference = useCallback((next: ThemePreference) => {
    setThemePreference(next)
  }, [])

  // Read through the store rather than closed over `theme`, so the callback
  // identity stays stable and the button does not re-render the nav on scroll.
  const toggle = useCallback(() => {
    setThemePreference(resolved === 'dark' ? 'light' : 'dark')
  }, [])

  return {
    theme,
    preference,
    followsSystem: themeFollowsSystem(),
    setPreference,
    toggle,
  }
}

/**
 * Narrower subscription for consumers that only need to know which theme is on
 * screen — the WebGL scene, which re-reads its palette when this flips.
 */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, getSnapshot)
}
