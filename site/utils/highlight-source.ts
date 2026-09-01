const trustedShikiHtml = Symbol("trusted-shiki-html");

/** HTML produced by Shiki from repository-local source, safe for the docs rendering sink. */
export type TrustedShikiHtml = string & { readonly [trustedShikiHtml]: true };

export async function highlightRepositorySource(
  source: string,
  lang: "css" | "ts" | "vue",
): Promise<TrustedShikiHtml> {
  const { codeToHtml } = await import("shiki");
  return codeToHtml(source, {
    lang,
    theme: "github-dark-high-contrast",
  }) as Promise<TrustedShikiHtml>;
}
