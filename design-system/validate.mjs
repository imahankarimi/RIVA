#!/usr/bin/env node
/**
 * RIVA DESIGN SYSTEM — integrity check
 * ===========================================================================
 * Run from either app:  `npm run design:check`
 *
 * The design system only stays trustworthy if its invariants are enforced, not
 * just documented. This script fails loudly on the four ways RIVA's tokens have
 * historically rotted:
 *
 *   1. A colour token declared in `:root` but missing from `.dark`, which
 *      silently falls back to its light value and produces unreadable text.
 *   2. A theme-independent token (radius, spacing, motion, layout, glass) that
 *      has been re-declared under `.dark`, implying it themes when it does not.
 *   3. An app that has stopped consuming the shared preset / token file and
 *      gone back to keeping its own copy of the design system.
 *   4. A token literal re-introduced into an app stylesheet, which would
 *      silently fork the source of truth.
 *
 * Exit code 0 = healthy. Non-zero = do not commit.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const TOKENS = join(ROOT, "design-system", "tokens.css");
const PRESET = join(ROOT, "design-system", "tailwind-preset.ts");
const APPS = ["frontend", "webapp"];

/**
 * Prefixes that are deliberately theme-INDEPENDENT. They are declared once in
 * `:root` and must never be repeated under `.dark`: re-declaring them would
 * imply they theme, and would hide the fact that they cannot.
 */
const THEME_INDEPENDENT = [
  "--glass-",
  "--r-",
  "--space-",
  "--gutter",
  "--section-gap",
  "--touch-min",
  "--dur-",
  "--ease-",
  "--content-max",
  "--topbar-h",
  "--sidebar-w",
  "--mobile-nav-h",
];

const errors = [];
const warnings = [];

function isThemeIndependent(token) {
  return THEME_INDEPENDENT.some((p) => token.startsWith(p));
}

function section(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return css.slice(open + 1);
}

function declaredTokens(block) {
  return new Set(
    [...block.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1])
  );
}

// --- 1 & 2: token completeness ------------------------------------------------
const css = readFileSync(TOKENS, "utf8");
const rootTokens = declaredTokens(section(css, ":root"));
const darkTokens = declaredTokens(section(css, ".dark"));

for (const token of rootTokens) {
  if (isThemeIndependent(token)) continue;
  if (!darkTokens.has(token)) {
    errors.push(
      `tokens.css: colour token ${token} is declared in :root but has no .dark counterpart.`
    );
  }
}
for (const token of darkTokens) {
  if (!rootTokens.has(token)) {
    errors.push(`tokens.css: .dark declares ${token}, which :root does not.`);
  }
  if (isThemeIndependent(token)) {
    errors.push(
      `tokens.css: ${token} is theme-independent but is re-declared under .dark. Remove it.`
    );
  }
}

// --- 3: apps still consume the shared system -----------------------------------
if (!existsSync(PRESET)) {
  errors.push("design-system/tailwind-preset.ts is missing.");
}

for (const app of APPS) {
  const appDir = join(ROOT, app);
  if (!existsSync(appDir)) continue;

  const twPath = join(appDir, "tailwind.config.ts");
  const cssPath = join(appDir, "app", "globals.css");

  const tw = existsSync(twPath) ? readFileSync(twPath, "utf8") : "";
  if (!/from\s+["']\.\.\/design-system\/tailwind-preset["']/.test(tw)) {
    errors.push(
      `${app}/tailwind.config.ts does not consume design-system/tailwind-preset.ts.`
    );
  }

  const globals = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  if (!globals.includes("design-system/tokens.css")) {
    errors.push(`${app}/app/globals.css does not import design-system/tokens.css.`);
  }

  // --- 4: no forked token literals -------------------------------------------
  // A hex or bare triplet in an app stylesheet would be a second source of truth.
  const hexes = globals.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const strayTriplets = globals.match(/--c-[a-z0-9-]+\s*:\s*\d+\s+\d+\s+\d+/g) || [];
  const allowedHex = new Set(["#F7F7F3"]); // documented manifest brand value

  for (const hex of hexes) {
    if (!allowedHex.has(hex)) {
      errors.push(
        `${app}/app/globals.css contains the literal ${hex}; tokens belong in design-system/tokens.css.`
      );
    }
  }
  for (const decl of strayTriplets) {
    errors.push(
      `${app}/app/globals.css re-declares the token "${decl.split(":")[0].trim()}"; it must come from design-system/tokens.css.`
    );
  }
}

// --- 5: every :root semantic token should be reachable from Tailwind ------------
const preset = existsSync(PRESET) ? readFileSync(PRESET, "utf8") : "";
const semantic = [...rootTokens].filter(
  (t) =>
    t.startsWith("--c-") &&
    !t.startsWith("--c-chart-") &&
    !t.startsWith("--c-signal-") &&
    !t.startsWith("--c-amber-") &&
    !t.startsWith("--c-rose-") &&
    !t.startsWith("--c-moss-") &&
    !/^--c-(paper|surface|surface-muted|surface-raised|ink|ink-soft|ink-faint|line|line-soft|on-signal|scrollbar|receipt-punch)$/.test(t)
);
for (const token of semantic) {
  if (!preset.includes(token.slice(2))) {
    warnings.push(
      `design-system: ${token} is defined in tokens.css but not exposed in tailwind-preset.ts.`
    );
  }
}

// --- report --------------------------------------------------------------------
const rel = (p) => relative(ROOT, p);

if (warnings.length) {
  console.log("RIVA design system — warnings\n");
  for (const w of warnings) console.log("  ~ " + w);
  console.log("");
}

if (errors.length) {
  console.error("RIVA design system — FAILED\n");
  for (const e of errors) console.error("  x " + e);
  console.error("");
  process.exit(1);
}

console.log(
    `RIVA design system — OK (${rootTokens.size} tokens in :root, ${darkTokens.size} in .dark, ${APPS.length} apps on the shared preset).`
);
console.log(`  ${rel(TOKENS)}\n  ${rel(PRESET)}`);