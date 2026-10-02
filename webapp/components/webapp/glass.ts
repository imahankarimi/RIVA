/**
 * Liquid Glass tokens for premium Apple-style navigation. The glass layer
 * is the primary navigation surface; content stays crisp. Designed to float
 * above content in both light and dark modes with translucent materials,
 * refined blur, and subtle specular highlights.
 *
 * Light mode: warm white glass with subtle dark shadows
 * Dark mode: translucent dark surfaces with warm highlights
 */

// Shared refraction/lensing effect — soft glow at the top edge
const SPECULAR_GLOW = `
  after:pointer-events-none after:absolute after:inset-0
  after:rounded-[inherit]
  after:bg-[radial-gradient(120%_50%_at_50%_-30%,rgba(255,255,255,0.45),transparent_65%)]
  after:content-['']
`;

// Dark mode specular (warm tone)
const SPECULAR_GLOW_DARK = `
  after:pointer-events-none after:absolute after:inset-0
  after:rounded-[inherit]
  after:bg-[radial-gradient(120%_50%_at_50%_-30%,rgba(247,247,243,0.15),transparent_65%)]
  after:content-['']
`;

export const GLASS = {
  // Light mode: the premium baseline for navigation bars
  light: {
    topbar: `
      border border-white/50
      bg-white/[0.68]
      text-deep-ink
      shadow-[0_12px_32px_-8px_rgba(16,28,44,0.18)]
      backdrop-blur-[18px]
      dark:border-white/10
      dark:bg-surface/[0.55]
      dark:text-ink
      dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]
    `,
    nav: `
      border border-white/50
      bg-white/[0.65]
      text-deep-ink
      shadow-[0_16px_40px_-12px_rgba(16,28,44,0.22)]
      backdrop-blur-[20px]
      dark:border-white/10
      dark:bg-surface/[0.52]
      dark:text-ink
      dark:shadow-[0_12px_32px_-10px_rgba(0,0,0,0.45)]
    `,
    glow: SPECULAR_GLOW,
  },
  dark: {
    topbar: `
      border border-white/10
      bg-surface/[0.55]
      text-ink
      shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]
      backdrop-blur-[18px]
    `,
    nav: `
      border border-white/10
      bg-surface/[0.52]
      text-ink
      shadow-[0_12px_32px_-10px_rgba(0,0,0,0.45)]
      backdrop-blur-[20px]
    `,
    glow: SPECULAR_GLOW_DARK,
  },

  // Backwards compatibility: base + glow for existing components
  base: `
    border border-white/50
    bg-white/[0.68]
    text-deep-ink
    shadow-[0_12px_32px_-8px_rgba(16,28,44,0.18)]
    backdrop-blur-[18px]
    dark:border-white/10
    dark:bg-surface/[0.55]
    dark:text-ink
    dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]
  `,
  glow: SPECULAR_GLOW,
} as const;