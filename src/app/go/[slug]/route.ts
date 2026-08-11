import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
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
    let targetLink = product.affiliate_links.find(
      (l) => l.network.toLowerCase() === requestedNetwork && l.is_in_stock
    );

    if (!targetLink) {
      targetLink = product.affiliate_links.find((l) => l.is_in_stock) || product.affiliate_links[0];
    }

    // 3. Generate click_id and extract request metadata
    const clickId = uuidv4();
    const sourcePage = request.headers.get('referer') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    const clickPayload = {
      click_id: clickId,
      product_id: product.id,
      network: targetLink.network,
      source_page: sourcePage,
      ip_hash: ip,
      user_agent: userAgent,
      timestamp: Date.now(),
    };

    // 4. Push to Redis queue asynchronously (non-blocking for fast response < 200ms)
    try {
      if (redis.status === 'ready' || redis.status === 'connecting') {
        await redis.lpush('deskholt:click_queue', JSON.stringify(clickPayload));
      }
    } catch (redisErr) {
      console.error('Redis Queue push error:', redisErr);
      // Fallback: direct async insert to Postgres
      prisma.click.create({
        data: {
          click_id: clickId,
          product_id: product.id,
          network: targetLink.network,
          source_page: sourcePage,
          user_agent: userAgent,
        },
      }).catch(console.error);
    }

    // 5. Append SubID to tracking URL for network postback attribution
    let redirectUrl = targetLink.tracking_url;
    if (redirectUrl.includes('{subid}')) {
      redirectUrl = redirectUrl.replace('{subid}', clickId);
    } else if (redirectUrl.includes('?')) {
      redirectUrl += `&subid=${clickId}`;
    } else {
      redirectUrl += `?subid=${clickId}`;
    }

    // 6. 302 Temporary Redirect to merchant store
    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Link tracking engine error:', error);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
