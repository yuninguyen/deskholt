import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendClickId, getClientIp, hashIp, selectAffiliateLink } from '@/lib/clickTracking';
import { persistClickWithRetry } from '@/lib/products/clickPersistence';
import { v4 as uuidv4 } from 'uuid';
import { evaluateProductAccess } from '@/lib/products/productAccessPolicy';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 10;
const DEFAULT_TIMEOUT_MS = 150;
const ROUTE_MAX_ATTEMPTS = 5;
const ROUTE_MAX_BACKOFF_MS = 100;
const ROUTE_MAX_TIMEOUT_MS = 1_000;

function envInteger(name: string, fallback: number, minimum: number, maximum: number) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;

  const value = Number(raw);
  return Number.isFinite(value) && Number.isInteger(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

function persistenceConfig() {
  return {
    maxAttempts: envInteger('CLICK_PERSIST_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS, 1, ROUTE_MAX_ATTEMPTS),
    backoffMs: envInteger('CLICK_PERSIST_BACKOFF_MS', DEFAULT_BACKOFF_MS, 0, ROUTE_MAX_BACKOFF_MS),
    timeoutMs: envInteger('CLICK_PERSIST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, 1, ROUTE_MAX_TIMEOUT_MS),
  };
}

function safeDestination(url: string) {
  try {
    const destination = new URL(url);
    return destination.origin + destination.pathname;
  } catch {
    return 'invalid-destination';
  }
}

function emitPersistenceFailure(event: Record<string, unknown>) {
  try {
    console.error(event);
  } catch {
    // Logging is best-effort and must never replace the merchant redirect outcome.
  }
}

function controlledErrorMetadata(error: unknown) {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    && typeof error.code === 'string'
    ? error.code
    : null;
  return { errorName, errorCode };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const requestedNetwork = searchParams.get('network')?.toLowerCase();

  try {
    // 1. Fetch product and its active affiliate links
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        affiliate_links: {
          orderBy: [
            { is_in_stock: 'desc' },
            { priority_order: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    const access = evaluateProductAccess(product);
    if (!access.isCommerceEligible) {
      return new NextResponse(null, { status: 404 });
    }

    if (product.affiliate_links.length === 0) {
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    // 2. Select best link: matching network if in stock, else fallback to top priority in-stock link
    const targetLink = selectAffiliateLink(product.affiliate_links, requestedNetwork);
    if (!targetLink) return NextResponse.redirect(new URL('/', request.url), 302);

    // 3. Generate click identity and timestamp once for this request lifecycle.
    const clickId = uuidv4();
    const clickedAt = new Date();
    const sourcePage = request.headers.get('referer') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const ip = getClientIp(request.headers);
    const ipSalt = process.env.CLICK_HASH_SALT || process.env.REVALIDATE_SECRET || 'deskholt-dev';

    const click = {
      click_id: clickId,
      product_id: product.id,
      network: targetLink.network,
      source_page: sourcePage,
      ip_hash: hashIp(ip, ipSalt),
      user_agent: userAgent,
      created_at: clickedAt,
    };

    // V1 accepts attribution loss after exhausted persistence so the merchant redirect remains available.
    // A timeout can be an ambiguous commit: the row may commit after this failure metric is emitted,
    // so click_persistence_failure_total can over-count true attribution loss.
    try {
      const result = await persistClickWithRetry({
        create: prisma.click.create.bind(prisma.click),
        click,
        ...persistenceConfig(),
      });

      if (result.outcome === 'exhausted') {
        emitPersistenceFailure({
          event: 'click_persistence_exhausted',
          metric: 'click_persistence_failure_total',
          clickId,
          clickedAt,
          productId: product.id,
          productSlug: product.slug,
          affiliateLinkId: targetLink.id,
          merchant: targetLink.network,
          network: targetLink.network,
          destination: safeDestination(targetLink.tracking_url),
          classification: result.classification,
          attempts: result.attempts,
        });
      }
    } catch (error) {
      emitPersistenceFailure({
        event: 'click_persistence_unexpected_failure',
        metric: 'click_persistence_failure_total',
        clickId,
        clickedAt,
        productId: product.id,
        productSlug: product.slug,
        affiliateLinkId: targetLink.id,
        merchant: targetLink.network,
        network: targetLink.network,
        destination: safeDestination(targetLink.tracking_url),
        classification: 'unexpected',
        attempts: null,
        ...controlledErrorMetadata(error),
      });
    }

    // 4. Append SubID to tracking URL for network postback attribution
    const redirectUrl = appendClickId(targetLink.tracking_url, clickId);

    // 5. 302 Temporary Redirect to merchant store
    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Link tracking engine error:', error);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
