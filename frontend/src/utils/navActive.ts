/** Highlight the single best-matching nav path (longest prefix wins). */
export function getActiveNavPath(pathname: string, navPaths: string[]): string | null {
  const matches = navPaths.filter((path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  });

  if (!matches.length) return null;
  return matches.sort((a, b) => b.length - a.length)[0];
}

export function isNavItemActive(pathname: string, itemPath: string, navPaths: string[]): boolean {
  return getActiveNavPath(pathname, navPaths) === itemPath;
}
