import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { appendClickId, getClientIp, hashIp, selectAffiliateLink } from '@/lib/clickTracking';
import { v4 as uuidv4 } from 'uuid';

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

    if (!product || product.affiliate_links.length === 0) {
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    // 2. Select best link: matching network if in stock, else fallback to top priority in-stock link
    const targetLink = selectAffiliateLink(product.affiliate_links, requestedNetwork);
    if (!targetLink) return NextResponse.redirect(new URL('/', request.url), 302);

    // 3. Generate click_id and extract request metadata
    const clickId = uuidv4();
    const sourcePage = request.headers.get('referer') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const ip = getClientIp(request.headers);
    const ipSalt = process.env.CLICK_HASH_SALT || process.env.REVALIDATE_SECRET || 'deskholt-dev';

    const clickPayload = {
      click_id: clickId,
      product_id: product.id,
      network: targetLink.network,
      source_page: sourcePage,
      ip_hash: hashIp(ip, ipSalt),
      user_agent: userAgent,
      timestamp: Date.now(),
    };

    // 4. Push to Redis queue asynchronously (non-blocking for fast response < 200ms)
    try {
      await redis.lpush('deskholt:click_queue', JSON.stringify(clickPayload));
    } catch (redisErr) {
      console.error('Redis Queue push error:', redisErr);
      // Fallback: direct async insert to Postgres
      await prisma.click.create({
        data: {
          click_id: clickId,
          product_id: product.id,
          network: targetLink.network,
          source_page: sourcePage,
          ip_hash: clickPayload.ip_hash,
          user_agent: userAgent,
        },
      });
    }

    // 5. Append SubID to tracking URL for network postback attribution
    const redirectUrl = appendClickId(targetLink.tracking_url, clickId);

    // 6. 302 Temporary Redirect to merchant store
    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Link tracking engine error:', error);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
