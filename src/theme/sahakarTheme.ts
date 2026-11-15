/**
 * Sahakar Nyaya theme wiring.
 *
 * We consume Astryx Stone via its pre-built artifacts:
 *   - `@astryxdesign/theme-stone/theme.css` (token layer, imported in main.tsx)
 *   - `stoneTheme` from `@astryxdesign/theme-stone/built` (theme object for <Theme>)
 *
 * Our maroon/gold identity is applied as UNLAYERED CSS custom-property overrides
 * in src/styles.css (unlayered rules beat Astryx's `@layer astryx-theme` tokens),
 * overriding only: --color-accent, --color-on-accent, --color-text-accent,
 * --color-icon-accent, --color-accent-muted, font families, and body background.
 * We avoid defineTheme({extends: stoneTheme}) because defineTheme documents that
 * `extends` must receive a theme *created by defineTheme()* — generated artifacts
 * export `<name>Theme`, which the guard explicitly rejects.
 */
import { stoneTheme } from "@astryxdesign/theme-stone/built";

export { stoneTheme };

export const BRAND = {
  maroon: "#7A1F2B",
  maroonDark: "#8E2836",
  gold: "#B98A2B",
  cream: "#F6F4EF",
} as const;
