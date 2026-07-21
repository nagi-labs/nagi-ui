import fs from "node:fs"

import { nagiThemeTokens } from "../theme/tokens.mjs"

const TOKEN_DECLARATION = /(--nagi-[a-z0-9-]+)\s*:\s*([^;]+);/g
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g

export function checkThemeFiles(files) {
  const defined = new Set()
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8").replace(CSS_COMMENT, "")
    for (const match of source.matchAll(TOKEN_DECLARATION)) {
      if (match[2]?.trim()) defined.add(match[1])
    }
  }

  const required = new Set(nagiThemeTokens)
  return {
    defined: [...defined].sort(),
    missing: nagiThemeTokens.filter((token) => !defined.has(token)),
    unknown: [...defined].filter((token) => !required.has(token)).sort(),
  }
}
