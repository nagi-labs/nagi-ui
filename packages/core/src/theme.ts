import { nagiThemeTokens } from "../theme/tokens.mjs"

export const requiredNagiThemeTokens = nagiThemeTokens

/** Returns tokens that are absent from the computed cascade at a theme root. */
export function missingNagiThemeTokens(root: Element): readonly string[] {
  const view = root.ownerDocument.defaultView
  if (!view) return [...requiredNagiThemeTokens]
  const style = view.getComputedStyle(root)
  return requiredNagiThemeTokens.filter(
    (token) => style.getPropertyValue(token).trim() === "",
  )
}

/** Explicit dev diagnostic; Nagi never installs a production observer. */
export function warnMissingNagiThemeTokens(root: Element): readonly string[] {
  const missing = missingNagiThemeTokens(root)
  if (missing.length > 0) {
    console.warn(
      `[Nagi UI] Missing theme tokens: ${missing.join(", ")}. `
        + "Import @nagi-labs/nagi-ui/default-theme.css or complete the replacement theme.",
    )
  }
  return missing
}
