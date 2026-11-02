# RIVA Design System

The single source of truth for RIVA's visual language.

| File | What it is |
|---|---|
| `tokens.css` | Every colour, radius, shadow, spacing, motion and layout value. Light + dark. |
| `tailwind-preset.ts` | The Tailwind theme that exposes those tokens as utilities. |
| `glass.ts` | The Liquid Glass material used by the navigation layer. |
| `validate.mjs` | Integrity check — run with `npm run design:check` from either app. |
| `../docs/DESIGN_SYSTEM.md` | The full specification: rationale, rules, and every component. |

## How an app consumes it

Both frontends are wired to this folder and must stay that way:

```
frontend/  (RIVA Main, :3000)  ─┐
                                ├─► design-system/tokens.css      via app/globals.css @import
webapp/    (RIVA Web,  :3001)  ─┘
                                └─► design-system/tailwind-preset.ts  via tailwind.config.ts presets:[]
```

`npm run design:check` in either app fails if that wiring is broken, if a colour
token lost its dark-mode counterpart, or if a token literal has been
re-introduced into an app stylesheet.

## Adding or changing a token

1. Declare it in `tokens.css` — in `:root` **and** in `.dark` if it is a colour.
   Theme-independent values (radius, spacing, motion, layout, glass) go in
   `:root` only; the validator rejects them appearing under `.dark`.
2. Expose it in `tailwind-preset.ts`.
3. Document it in `docs/DESIGN_SYSTEM.md`.
4. Run `npm run design:check` and `npm run build` in both apps.

## Rules

- Never hardcode a hex, an RGB triplet, or an arbitrary opacity for a brand or
  semantic colour in a component. Use a token.
- Never write `dark:` variants for token-backed colours. The tokens already
  invert; a `dark:` override means the token is wrong.
- Never fork the system. If an app needs something the tokens do not cover, add
  a token here — do not add a second definition in that app.