const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Deskholt database with sample Home-Office products...');

  await prisma.conversion.deleteMany();
  await prisma.click.deleteMany();
  await prisma.affiliateLink.deleteMany();
  await prisma.product.deleteMany();

  // 1. Uplift V2 Standing Desk
  const upliftDesk = await prisma.product.create({
    data: {
      name: 'Uplift V2 Standing Desk (Bamboo Top)',
      slug: 'uplift-v2-standing-desk-bamboo',
      category: 'standing-desks',
      description: 'Top-tier electric standing desk with dual motors, 355 lbs weight capacity, and sustainable bamboo desktop.',
      image_url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80',
      specs: JSON.stringify({
        height_range: '25.3" - 50.9"',
        weight_capacity: '355 lbs',
        warranty: '15-Year Warranty',
        desktop_material: 'FSC-Certified Bamboo',
      }),
      upc_code: '85001234501',
      user_sentiment: JSON.stringify({
        positive_pct: 88,
        summary: 'Users love the stability at maximum height and smooth motor transition. High build quality with 15yr warranty.',
        top_complaint: 'Assembly instructions can be tedious for single-person setup.',
      }),
      is_indexed: true,
      is_sustainable: true,
      affiliate_links: {
        create: [
          {
            network: 'amazon',
            price: 599.00,
            raw_url: 'https://www.amazon.com/dp/B08XYZ1234',
            tracking_url: 'https://www.amazon.com/dp/B08XYZ1234?tag=deskholt-20',
            is_in_stock: true,
            priority_order: 1,
          },
          {
            network: 'walmart',
            price: 589.99,
            raw_url: 'https://www.walmart.com/ip/Uplift-V2-Bamboo/10293847',
            tracking_url: 'https://goto.walmart.com/c/123456/567890/9999?url=https://www.walmart.com/ip/10293847',
            is_in_stock: true,
            priority_order: 2,
          },
        ],
      },
    },
  });

  // 2. Steelcase Gesture Ergonomic Chair
  const steelcaseChair = await prisma.product.create({
    data: {
      name: 'Steelcase Gesture Ergonomic Chair',
      slug: 'steelcase-gesture-chair',
      category: 'ergonomic-chairs',
      description: 'Award-winning ergonomic desk chair designed for how we use modern devices. 3D LiveBack technology.',
      image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1209?w=800&auto=format&fit=crop&q=80',
      specs: JSON.stringify({
        weight_capacity: '400 lbs',
        recline_lock: '4 positions',
        armrests: '4D Adjustable',
        material: 'Recycled Fabric & Alloy',
      }),
      upc_code: '85001234502',
      user_sentiment: JSON.stringify({
        positive_pct: 92,
        summary: 'Extremely durable, class-leading armrest adjustability for multi-device work. Excellent lower back support.',
        top_complaint: 'Seat cushion may feel firm for users who prefer plush pillow tops.',
      }),
      is_indexed: true,
      is_sustainable: true,
      affiliate_links: {
        create: [
          {
            network: 'amazon',
            price: 1399.00,
            raw_url: 'https://www.amazon.com/dp/B09ABC5678',
            tracking_url: 'https://www.amazon.com/dp/B09ABC5678?tag=deskholt-20',
            is_in_stock: true,
            priority_order: 1,
          },
          {
            network: 'target',
            price: 1349.99,
            raw_url: 'https://www.target.com/p/steelcase-gesture/-/A-98765432',
            tracking_url: 'https://target.geori.net/c/12345/6789/98765432',
            is_in_stock: true,
            priority_order: 2,
          },
        ],
      },
    },
  });

  // 3. BenQ WiT e-Reading LED Desk Lamp
  const benqLamp = await prisma.product.create({
    data: {
      name: 'BenQ WiT e-Reading LED Desk Lamp',
      slug: 'benq-wit-ereading-led-desk-lamp',
      category: 'lighting',
      description: 'Wide curved LED desk lamp with auto-dimming technology designed for multi-monitor setups.',
      image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
      specs: JSON.stringify({
        coverage: '150% wider coverage',
        color_temp: '2700K - 5700K',
        brightness: 'Auto-dimming ambient sensor',
        lifespan: '50,000 Hours',
      }),
      upc_code: '85001234503',
      user_sentiment: JSON.stringify({
        positive_pct: 85,
        summary: 'Eliminates screen glare completely across dual monitor setups. Smooth touch dimming.',
        top_complaint: 'Heavy base requires sturdy desk edge.',
      }),
      is_indexed: true,
      is_sustainable: false,
      affiliate_links: {
        create: [
          {
            network: 'amazon',
            price: 229.00,
            raw_url: 'https://www.amazon.com/dp/B01C84074I',
            tracking_url: 'https://www.amazon.com/dp/B01C84074I?tag=deskholt-20',
            is_in_stock: true,
            priority_order: 1,
          },
          {
            network: 'walmart',
            price: 219.99,
            raw_url: 'https://www.walmart.com/ip/BenQ-WiT/54321098',
            tracking_url: 'https://goto.walmart.com/c/123456/567890/9999?url=https://www.walmart.com/ip/54321098',
            is_in_stock: true,
            priority_order: 2,
          },
        ],
      },
    },
  });

  // 4. Anker Magnetic Cable Holder
  const cableHolder = await prisma.product.create({
    data: {
      name: 'Anker Magnetic Cable Holder (Recycled Silicone)',
      slug: 'anker-magnetic-cable-holder-eco',
      category: 'cable-management',
      description: 'Keep your desktop clutter-free with magnetic cable clips made from 100% recycled silicone.',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      specs: JSON.stringify({
        clips_included: '5 Magnetic Clips',
        compatibility: '3.5mm Cables (USB-C, Lightning, HDMI)',
        reusable: 'Washable adhesive base',
      }),
      upc_code: '85001234504',
      user_sentiment: JSON.stringify({
        positive_pct: 94,
        summary: 'Simple, effective, clean design. Strong magnets prevent heavy cords from falling.',
        top_complaint: 'Thick braided cables require extra clip stretching.',
      }),
      is_indexed: true,
      is_sustainable: true,
      affiliate_links: {
        create: [
          {
            network: 'amazon',
            price: 14.99,
            raw_url: 'https://www.amazon.com/dp/B08X123999',
            tracking_url: 'https://www.amazon.com/dp/B08X123999?tag=deskholt-20',
            is_in_stock: true,
            priority_order: 1,
          },
        ],
      },
    },
  });

  console.log(`Seeded 4 products successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
