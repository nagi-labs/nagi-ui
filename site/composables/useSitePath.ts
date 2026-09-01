export function useSitePath(path = "/") {
  const base = useRuntimeConfig().app.baseURL;
  const relativePath = path.replace(/^\//, "");
  const canonicalPath =
    relativePath === "" || relativePath.endsWith("/") || /\.[^/]+$/u.test(relativePath)
      ? relativePath
      : `${relativePath}/`;
  return `${base}${canonicalPath}`;
}
