#!/usr/bin/env node
/**
 * scripts/check-contrast.mjs
 *
 * Asserts the design tokens in src/styles/global.css meet WCAG contrast in
 * BOTH themes, and that the two dark blocks (§6.2 blocks 2b and 2c) have not
 * drifted apart.
 *
 * It parses global.css rather than restating the palette, so it cannot go
 * stale: change a token, and this either still passes or tells you exactly
 * which pair broke. Same principle as the Zod schemas — a mistake becomes a
 * build error instead of an unreadable page nobody reports.
 *
 * Run: node scripts/check-contrast.mjs   (wired into `npm run check`)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(HERE, '../src/styles/global.css');

const SYS_DARK_SELECTOR = ":root:not([data-theme='light'])";
const EXPLICIT_DARK_SELECTOR = ":root[data-theme='dark']";

/* ---------------------------------------------------------------- parsing */

/** Split a stylesheet into flat { sel, body } rules, tracking brace depth. */
function parseRules(src) {
  const rules = [];
  let buf = '';
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      const sel = buf.trim();
      buf = '';
      let depth = 1;
      let j = i + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth += 1;
        else if (src[j] === '}') depth -= 1;
        j += 1;
      }
      rules.push({ sel, body: src.slice(i + 1, j - 1) });
      i = j;
    } else if (ch === ';' || ch === '}') {
      buf = '';
      i += 1;
    } else {
      buf += ch;
      i += 1;
    }
  }
  return rules;
}

/** Pull `--name: value` pairs out of a rule body, ignoring nested rules. */
function customProps(body) {
  const flat = body.replace(/\{[^{}]*\}/g, '');
  const out = new Map();
  for (const m of flat.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

const css = readFileSync(CSS_PATH, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const top = parseRules(css);

/** Light base: every unconditional `:root { … }` block, merged in order. */
const light = new Map();
for (const r of top) {
  if (r.sel === ':root') for (const [k, v] of customProps(r.body)) light.set(k, v);
}

const squash = (s) => s.replace(/\s+/g, '');

/** Block 2b — the system-preference dark override, nested in an @media. */
const sysDark = new Map();
let sysDarkBody = '';
for (const r of top) {
  if (!/^@media\s*\(prefers-color-scheme:\s*dark\)/.test(r.sel)) continue;
  for (const inner of parseRules(r.body)) {
    if (squash(inner.sel) !== squash(SYS_DARK_SELECTOR)) continue;
    sysDarkBody += inner.body;
    for (const [k, v] of customProps(inner.body)) sysDark.set(k, v);
  }
}

/** Block 2c — the explicit dark choice. */
const explicitDark = new Map();
let explicitDarkBody = '';
for (const r of top) {
  if (squash(r.sel) !== squash(EXPLICIT_DARK_SELECTOR)) continue;
  explicitDarkBody += r.body;
  for (const [k, v] of customProps(r.body)) explicitDark.set(k, v);
}

/* -------------------------------------------------------------- resolving */

/** Resolve a token to a literal, following var() indirection through a scope. */
function resolve_(name, overrides, seen = new Set()) {
  if (seen.has(name)) throw new Error(`circular custom property: ${name}`);
  seen.add(name);
  const raw = overrides.get(name) ?? light.get(name);
  if (raw === undefined) throw new Error(`undefined custom property: ${name}`);
  const varRef = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  return varRef ? resolve_(varRef[1], overrides, seen) : raw;
}

/* --------------------------------------------------------------- contrast */

function srgb(hex) {
  let h = hex.trim().replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`not a hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

const luminance = (hex) => {
  const [r, g, b] = srgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * The semantic contract. Every one of these MUST be declared in all three
 * theme blocks. Raw ramp tokens (--w-*, --c-*, --a-*, --ok-light, …) are
 * deliberately absent: they are theme-independent inputs, not tokens that
 * components are allowed to reference.
 */
const SEMANTIC_TOKENS = [
  '--bg',
  '--surface',
  '--surface-2',
  '--ink',
  '--ink-2',
  '--ink-3',
  '--line',
  '--line-strong',
  '--control',
  '--accent',
  '--accent-hover',
  '--accent-soft',
  '--on-accent',
  '--ok',
  '--ok-soft',
  '--warn',
  '--warn-soft',
  '--info',
  '--info-soft',
  '--neutral',
  '--neutral-soft',
  '--overlay',
  '--shadow-1',
  '--shadow-2',
];

/**
 * [foreground token, background token, minimum ratio, why]
 *
 * 7.0 → WCAG AAA body text (§6.4: AAA on long-form prose)
 * 4.5 → WCAG AA  body text (§6.4: AA on body text)
 * 3.0 → WCAG AA  non-text: control borders, focus rings (1.4.11)
 */
const MATRIX = [
  ['--ink', '--bg', 7, 'body + headings on the page ground'],
  ['--ink', '--surface', 7, 'body on a card'],
  ['--ink', '--surface-2', 7, 'body on an inset panel'],
  ['--ink-2', '--bg', 4.5, 'secondary prose'],
  ['--ink-2', '--surface', 4.5, 'secondary prose on a card'],
  ['--ink-3', '--bg', 4.5, 'metadata / captions'],
  ['--ink-3', '--surface', 4.5, 'metadata on a card'],
  ['--ink-3', '--surface-2', 4.5, 'metadata on an inset panel'],
  ['--accent', '--bg', 4.5, 'link text'],
  ['--accent', '--surface', 4.5, 'link on a card'],
  ['--accent', '--surface-2', 4.5, 'link on an inset panel'],
  ['--accent-hover', '--bg', 4.5, 'link hover'],
  ['--accent', '--accent-soft', 4.5, 'active nav pill'],
  ['--on-accent', '--accent', 4.5, 'primary button label'],
  ['--ok', '--ok-soft', 4.5, 'status badge: shipped / published'],
  ['--ok', '--bg', 4.5, 'status text on the page ground'],
  ['--warn', '--warn-soft', 4.5, 'status badge: under review / active'],
  ['--warn', '--bg', 4.5, 'status text on the page ground'],
  ['--info', '--info-soft', 4.5, 'status badge: preprint / prototype'],
  ['--info', '--bg', 4.5, 'status text on the page ground'],
  ['--neutral', '--neutral-soft', 4.5, 'status badge: archived'],
  ['--neutral', '--bg', 4.5, 'muted text on the page ground'],
  ['--control', '--bg', 3, 'control border (1.4.11)'],
  ['--control', '--surface', 3, 'control border on a card'],
  ['--control', '--surface-2', 3, 'control border on an inset panel'],
  ['--accent', '--bg', 3, 'focus ring on the page ground'],
  ['--accent', '--surface', 3, 'focus ring on a card'],
  ['--accent', '--surface-2', 3, 'focus ring on an inset panel'],
];

/* ------------------------------------------------------------------- main */

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  FAIL  ${msg}`);
};

console.log(`\nchecking ${CSS_PATH.replace(process.cwd() + '/', '')}\n`);

// 1. The two dark blocks must stay identical.
console.log('§6.2 dark blocks 2b/2c are in sync');
const allDarkKeys = new Set([...sysDark.keys(), ...explicitDark.keys()]);
if (allDarkKeys.size === 0) {
  fail('found no dark-theme tokens at all — did a selector change?');
}
for (const key of [...allDarkKeys].sort()) {
  const a = sysDark.get(key);
  const b = explicitDark.get(key);
  if (a === undefined) fail(`${key} is missing from the @media block (2b)`);
  else if (b === undefined) fail(`${key} is missing from [data-theme='dark'] (2c)`);
  else if (a !== b) fail(`${key} differs: 2b has "${a}", 2c has "${b}"`);
}

// 2. Every semantic token must be declared in all three blocks. A colour
//    defined only in light means dark silently inherits a light value.
for (const key of SEMANTIC_TOKENS) {
  if (!light.has(key)) fail(`${key} is missing from the bare :root light block (2a)`);
  if (!sysDark.has(key)) fail(`${key} is declared for light but never overridden for dark`);
}

// 3. Both dark blocks must flip color-scheme so UA widgets and scrollbars
//    match even before the inline script runs (and with JS disabled).
for (const [label, body] of [
  ['2b (@media prefers-color-scheme: dark)', sysDarkBody],
  ["2c ([data-theme='dark'])", explicitDarkBody],
]) {
  if (!/color-scheme:\s*dark/.test(body)) fail(`block ${label} does not set color-scheme: dark`);
}
if (failures === 0) console.log('  ok\n');
else console.log('');

// 3. Contrast, in both themes.
for (const [themeName, overrides] of [
  ['LIGHT', new Map()],
  ['DARK', explicitDark],
]) {
  console.log(`${themeName}`);
  for (const [fgToken, bgToken, min, why] of MATRIX) {
    const fg = resolve_(fgToken, overrides);
    const bg = resolve_(bgToken, overrides);
    const ratio = contrast(fg, bg);
    if (ratio < min) {
      fail(
        `${fgToken} (${fg}) on ${bgToken} (${bg}) = ${ratio.toFixed(2)}:1, need ${min}:1 — ${why}`,
      );
    }
  }
  console.log(`  ${MATRIX.length} pairs checked\n`);
}

if (failures > 0) {
  console.error(`${failures} contrast/token failure(s).\n`);
  process.exit(1);
}
console.log('All token contrast checks passed.\n');
