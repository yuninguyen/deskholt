export const DEFAULT_SITE_URL = 'https://deskholt.com';

export function getCanonicalSiteUrl(configuredUrl?: string): URL {
  const value = configuredUrl?.trim() || DEFAULT_SITE_URL;
  if (!/^[a-z][a-z0-9+.-]*:\/\/[^/]/i.test(value)) {
    throw new Error(`Invalid canonical site origin: ${value}`);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid canonical site origin: ${value}`);
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error(`Canonical site origin must use HTTP(S): ${value}`);
  }
  if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error(`Canonical site origin must not contain credentials, path, query, or fragment: ${value}`);
  }

  url.pathname = '/';
  return url;
}

export function getProductCanonicalUrl(rawPersistedSlug: string, siteUrl: URL): URL {
  const url = new URL(siteUrl.toString());
  url.pathname = `/products/${encodeURIComponent(rawPersistedSlug)}`;
  url.search = '';
  url.hash = '';
  return url;
}
