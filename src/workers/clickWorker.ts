import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

export async function processClickQueue() {
  console.log('[ClickWorker] Starting queue processor...');
  while (true) {
    try {
      // Pop click payload from Redis
      const rawData = await redis.rpop('deskholt:click_queue');
      if (!rawData) {
        // Sleep 1 second when queue is empty
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      const item = JSON.parse(rawData);
      await prisma.click.create({
        data: {
          click_id: item.click_id,
          product_id: item.product_id,
          network: item.network,
          source_page: item.source_page,
          ip_hash: item.ip_hash,
          user_agent: item.user_agent,
          us_state: item.us_state || null,
        },
      });

      console.log(`[ClickWorker] Processed click ${item.click_id} for product ${item.product_id}`);
    } catch (err) {
      console.error('[ClickWorker] Error processing queue item:', err);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

if (require.main === module) {
  processClickQueue();
}
