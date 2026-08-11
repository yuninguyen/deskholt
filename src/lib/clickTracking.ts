import { createHash } from 'node:crypto';

export type AffiliateLinkCandidate = {
  network: string;
  is_in_stock: boolean;
};

export function selectAffiliateLink<T extends AffiliateLinkCandidate>(
  links: T[],
  requestedNetwork?: string
): T | undefined {
  const normalizedNetwork = requestedNetwork?.toLowerCase();
  const requestedLink = links.find(
    (link) => link.network.toLowerCase() === normalizedNetwork && link.is_in_stock
  );

  return requestedLink ?? links.find((link) => link.is_in_stock) ?? links[0];
}

export function appendClickId(trackingUrl: string, clickId: string): string {
  if (trackingUrl.includes('{subid}')) {
    return trackingUrl.replace('{subid}', encodeURIComponent(clickId));
  }

  const url = new URL(trackingUrl);
  url.searchParams.set('subid', clickId);
  return url.toString();
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
