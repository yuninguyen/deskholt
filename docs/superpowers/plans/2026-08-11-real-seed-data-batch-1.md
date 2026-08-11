# Real Seed Data (Batch 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4 fake sample products in `prisma/seed.ts` with 20 real, researched home-office products (5 per existing site category), using real Amazon product URLs with a placeholder affiliate tag pending Associates approval.

**Architecture:** Single-file data change. `prisma/seed.ts` already wipes and recreates all `Product`/`AffiliateLink` rows on each run (`deleteMany` then `create`), so this plan replaces its body with 20 real entries in the same code shape already used, then verifies via direct DB query and a running dev server.

**Tech Stack:** Prisma (SQLite dev DB), Next.js 14 App Router, ts-node (`npm run db:seed`).

## Global Constraints

- Product data MUST be entered manually from real, publicly viewable listings — no bulk HTML scraping of Amazon (Constitution Principle II).
- `category` values MUST exactly match the 4 slugs already wired into the UI — `standing-desks`, `ergonomic-chairs`, `lighting`, `cable-management` (`src/app/page.tsx:21-24`, `src/app/category/[slug]/page.tsx:19-22`). No 5th category is introduced in this batch.
- `tracking_url` MUST use the placeholder `?tag=deskholt-pending` (not a fabricated real Associates tag) until the site owner's Associates account is approved (approved design, `docs/superpowers/specs/2026-08-11-real-seed-data-design.md`).
- Product images continue using the same Unsplash stock photo per category already used in the existing sample data — no Amazon image hotlinking.
- `is_sustainable` is set `true` only where the sourced listing itself states recycled/sustainable material (bamboo desktops below); never inferred.
- `user_sentiment` and `upc_code` are left unset for this batch — no fabricated review percentages or invented UPCs.

---

### Task 1: Replace seed.ts with 20 real products

**Files:**
- Modify: `prisma/seed.ts` (full rewrite of the 4-product body)

**Interfaces:**
- Produces: a `dev.db` (via `npm run db:seed`) containing 20 `Product` rows, each with exactly one `amazon` `AffiliateLink`, distributed 5 per category across `standing-desks`, `ergonomic-chairs`, `lighting`, `cable-management`.

- [ ] **Step 1: Replace the full contents of `prisma/seed.ts`**

```typescript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STOCK_IMAGE: Record<string, string> = {
  'standing-desks': 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80',
  'ergonomic-chairs': 'https://images.unsplash.com/photo-1580481072645-022f9a6d1209?w=800&auto=format&fit=crop&q=80',
  'lighting': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
  'cable-management': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
};

function amazonLink(asin: string, price: number, priorityOrder = 1) {
  return {
    network: 'amazon',
    price,
    raw_url: `https://www.amazon.com/dp/${asin}`,
    tracking_url: `https://www.amazon.com/dp/${asin}?tag=deskholt-pending`,
    is_in_stock: true,
    priority_order: priorityOrder,
  };
}

const products = [
  // --- standing-desks ---
  {
    name: 'UPLIFT V2 Standing Desk (Gray Frame, Bamboo Top)',
    slug: 'uplift-v2-standing-desk-bamboo-gray',
    category: 'standing-desks',
    description: 'Dual-motor electric standing desk with a 355 lb weight capacity and a bamboo desktop, built on the frame Wirecutter named Best Standing Desk.',
    specs: JSON.stringify({ height_range: '25.3" - 50.9"', weight_capacity: '355 lbs', desktop_material: 'Bamboo', motors: 'Dual Motor, 3-Stage Legs' }),
    is_sustainable: true,
    link: amazonLink('B01MU31LAW', 599.0),
  },
  {
    name: 'FlexiSpot E7 Pro Electric Standing Desk (Black)',
    slug: 'flexispot-e7-pro-standing-desk-black',
    category: 'standing-desks',
    description: 'Dual-motor, 3-stage standing desk with a 55x28" seamless solid slab top, backed by a 5-year frame/motor warranty.',
    specs: JSON.stringify({ dimensions: '55 x 28 inches', weight_capacity: '355 lbs', motors: 'Dual Motor, 3-Stage', warranty: '5-Year Frame & Motor' }),
    is_sustainable: false,
    link: amazonLink('B094N16PQM', 549.99),
  },
  {
    name: 'Autonomous SmartDesk (Dual Motor, Black Frame, White Top)',
    slug: 'autonomous-smartdesk-dual-motor-white',
    category: 'standing-desks',
    description: 'Budget-friendly dual-motor electric standing desk with a solid classic white top, popular as an entry point into sit-stand desks.',
    specs: JSON.stringify({ height_range: '24.5" - 50"', motors: 'Dual Motor', desktop_material: 'Solid Classic Top' }),
    is_sustainable: false,
    link: amazonLink('B01N5BXZI5', 429.0),
  },
  {
    name: 'Fully Jarvis Standing Desk 48"x30" (Bamboo Top, White Frame)',
    slug: 'fully-jarvis-standing-desk-bamboo-48x30',
    category: 'standing-desks',
    description: 'Jarvis standing desk with a solid slab bamboo top made from 100% sustainable materials and a memory-preset height controller.',
    specs: JSON.stringify({ dimensions: '48 x 30 inches', height_range: '25.5" - 51"', desktop_material: '100% Sustainable Bamboo' }),
    is_sustainable: true,
    link: amazonLink('B07GVPMJJV', 595.0),
  },
  {
    name: 'SHW 48-Inch Electric Standing Desk with Drawer (Black)',
    slug: 'shw-48in-standing-desk-drawer-black',
    category: 'standing-desks',
    description: 'Compact electric standing desk with a built-in storage drawer and cable management tray, memory height presets included.',
    specs: JSON.stringify({ dimensions: '48 x 24 inches', height_range: '28" - 45"', extras: 'Storage drawer + built-in cable tray' }),
    is_sustainable: false,
    link: amazonLink('B07MBR8N89', 299.99),
  },

  // --- ergonomic-chairs ---
  {
    name: 'Steelcase Series 1 Office Chair with Headrest (Graphite, Blue Jay)',
    slug: 'steelcase-series-1-chair-headrest',
    category: 'ergonomic-chairs',
    description: 'Steelcase Series 1 task chair with an included headrest, weight-activated recline, and Cogent Connect fabric upholstery.',
    specs: JSON.stringify({ frame_color: 'Graphite', fabric: 'Cogent Connect - Blue Jay', headrest: 'Included' }),
    is_sustainable: false,
    link: amazonLink('B09RGJXWDV', 549.0),
  },
  {
    name: 'Branch Ergonomic Chair (Black)',
    slug: 'branch-ergonomic-chair-black',
    category: 'ergonomic-chairs',
    description: 'Versatile mesh-back desk chair with adjustable lumbar support and smooth-rolling casters, built for 8+ hours of daily use.',
    specs: JSON.stringify({ backrest: 'Breathable Mesh', lumbar: 'Adjustable Lumbar Support', wheels: 'Smooth-Rolling Casters' }),
    is_sustainable: false,
    link: amazonLink('B0CK4245J2', 369.0),
  },
  {
    name: 'Branch Ergonomic Chair Pro (Black)',
    slug: 'branch-ergonomic-chair-pro-black',
    category: 'ergonomic-chairs',
    description: 'Higher-adjustment version of the Branch chair with 14 points of adjustment, 5D armrests, forward tilt, and smooth recline.',
    specs: JSON.stringify({ adjustment_points: '14', armrests: '5D Adjustable', features: 'Forward Tilt, Smooth Recline, Lumbar Support' }),
    is_sustainable: false,
    link: amazonLink('B0FMGZFVK9', 499.0),
  },
  {
    name: 'HON Ignition 2.0 Mid-Back Mesh Task Chair (Black)',
    slug: 'hon-ignition-2-mid-back-mesh-black',
    category: 'ergonomic-chairs',
    description: 'Mid-back mesh task chair with standard synchro-tilt control and height/width-adjustable arms, a common Amazon budget pick.',
    specs: JSON.stringify({ control: 'Standard Synchro-Tilt', arms: 'Height & Width Adjustable', lumbar: 'Adjustable Lumbar Support' }),
    is_sustainable: false,
    link: amazonLink('B07ZGFPQNW', 329.99),
  },
  {
    name: 'Duramont Ergonomic Office Chair (Gray)',
    slug: 'duramont-ergonomic-chair-gray',
    category: 'ergonomic-chairs',
    description: 'High-back mesh office chair with 4D adjustable lumbar support and rollerblade-style wheels for hard flooring.',
    specs: JSON.stringify({ lumbar: '4D Adjustable Lumbar Support', backrest: 'High-Back Breathable Mesh', wheels: 'Rollerblade Casters' }),
    is_sustainable: false,
    link: amazonLink('B0C995XP83', 299.99),
  },

  // --- lighting ---
  {
    name: 'BenQ ScreenBar Plus LED Monitor Light Bar (Matte Silver)',
    slug: 'benq-screenbar-plus-light-bar',
    category: 'lighting',
    description: 'Clip-on monitor light bar with a desktop dial, auto-dimming ambient sensor, and hue adjustment — no screen glare, no desk space used.',
    specs: JSON.stringify({ mount: 'Clip-on Monitor Top Mount', control: 'Desktop Dial, Auto-Dimming', power: 'USB Powered' }),
    is_sustainable: false,
    link: amazonLink('B07DP7RYXV', 109.99),
  },
  {
    name: 'BenQ ScreenBar Halo LED Monitor Light Bar',
    slug: 'benq-screenbar-halo-light-bar',
    category: 'lighting',
    description: 'Upgraded ScreenBar with a wireless controller and an added backlight behind the monitor to reduce screen contrast strain.',
    specs: JSON.stringify({ mount: 'Clip-on Monitor Top Mount', control: 'Wireless Controller', extras: 'Adds Backlight, No Screen Glare' }),
    is_sustainable: false,
    link: amazonLink('B08WT889V3', 189.99),
  },
  {
    name: 'BenQ e-Reading LED Desk Lamp (Matte Blue)',
    slug: 'benq-ereading-led-desk-lamp-blue',
    category: 'lighting',
    description: 'Wide, high-CRI swing-arm desk lamp with dual smart mode and auto-dimming, designed for reading and close desk work.',
    specs: JSON.stringify({ cri: 'High CRI', modes: 'Dual Smart Mode, Auto-Dimming', arm: 'Adjustable Arm' }),
    is_sustainable: false,
    link: amazonLink('B0178HLTXO', 129.99),
  },
  {
    name: 'Govee RGBIC Table Lamp',
    slug: 'govee-rgbic-table-lamp',
    category: 'lighting',
    description: 'App- and voice-controlled RGBIC table lamp for ambient desk-area lighting, with 64+ scene modes and music sync.',
    specs: JSON.stringify({ modes: '64+ Scene Modes', control: 'App + Voice Control (Alexa)', features: 'Music Sync' }),
    is_sustainable: false,
    link: amazonLink('B08R3F8ZQP', 59.99),
  },
  {
    name: 'Philips Ledino LED Desk Lamp (Grey)',
    slug: 'philips-ledino-led-desk-lamp-grey',
    category: 'lighting',
    description: 'Simple integrated-LED desk lamp with a flexible directional arm for a focused, adjustable beam of light.',
    specs: JSON.stringify({ bulb: 'Integrated 2.5W LED', arm: 'Flexible Directional Arm', control: 'On/Off Switch on Fixture' }),
    is_sustainable: false,
    link: amazonLink('B0079LSUN2', 44.99),
  },

  // --- cable-management ---
  {
    name: 'Anker Magnetic Cable Holder, 5 Clips (Blue)',
    slug: 'anker-magnetic-cable-holder-blue',
    category: 'cable-management',
    description: 'Adhesive magnetic clips that keep Lightning/USB-C/Micro cables anchored to the edge of a desk instead of falling behind it.',
    specs: JSON.stringify({ clips_included: '5 Magnetic Clips', compatibility: 'Lightning, USB-C, Micro Cables', mount: 'Adhesive (Wood, Marble, Metal, Glass)' }),
    is_sustainable: false,
    link: amazonLink('B08BLLNV44', 15.99),
  },
  {
    name: 'JOTO Cable Clips Cord Management System, 8-Piece Triple Slot (Black)',
    slug: 'joto-cable-clips-8pc-triple-slot-black',
    category: 'cable-management',
    description: 'Adhesive triple-slot cable clips for routing multiple cords along a desk or wall without a full sleeve or tray.',
    specs: JSON.stringify({ pieces: '8', slots_per_clip: '3', mount: 'Adhesive Desk/Wall Mount' }),
    is_sustainable: false,
    link: amazonLink('B016ZJDWZE', 8.99),
  },
  {
    name: 'JOTO Cable Management Sleeve, 4-Pack 19-20in (Black)',
    slug: 'joto-cable-management-sleeve-4pk-black',
    category: 'cable-management',
    description: 'Zippered neoprene sleeves that bundle multiple cords behind a desk into a single tidy tube, each holding 8-10 cables.',
    specs: JSON.stringify({ length: '19-20 inches', pack_size: '4', capacity: 'Up to 8-10 cables per sleeve' }),
    is_sustainable: false,
    link: amazonLink('B015HWXG4M', 16.99),
  },
  {
    name: 'Under Desk Cable Management Tray, No-Drill Metal Mesh',
    slug: 'under-desk-cable-tray-metal-mesh',
    category: 'cable-management',
    description: 'Clamp-mounted metal mesh tray that hides power strips and cable bundles underneath a desk without drilling into it.',
    specs: JSON.stringify({ mount: 'No-Drill Clamp Mount', material: 'Metal Mesh', pass_through: '2-Hole Cable Pass-Through' }),
    is_sustainable: false,
    link: amazonLink('B0BZ3GHM8N', 19.99),
  },
  {
    name: 'UGREEN Cable Management Box, Large (Black)',
    slug: 'ugreen-cable-management-box-large-black',
    category: 'cable-management',
    description: 'Large enclosed box that hides a power strip and its cable clutter, keeping surge protectors and chargers out of sight.',
    specs: JSON.stringify({ dimensions: '16.8 x 6.8 x 6 inches', compatibility: 'Power Strips, Chargers, Extension Cables', material: 'Fire-Resistant ABS' }),
    is_sustainable: false,
    link: amazonLink('B01IN9TH1C', 25.99),
  },
];

async function main() {
  console.log('Seeding Deskholt database with real Batch 1 home-office products...');

  await prisma.conversion.deleteMany();
  await prisma.click.deleteMany();
  await prisma.affiliateLink.deleteMany();
  await prisma.product.deleteMany();

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        category: p.category,
        description: p.description,
        image_url: STOCK_IMAGE[p.category],
        specs: p.specs,
        is_indexed: true,
        is_sustainable: p.is_sustainable,
        affiliate_links: { create: [p.link] },
      },
    });
  }

  console.log(`Seeded ${products.length} products successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run the seed script**

Run: `npm run db:seed`
Expected: last line of output is `Seeded 20 products successfully!` with no errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "$(cat <<'EOF'
Replace sample seed data with 20 real Batch 1 products

Real Amazon products across the 4 existing categories (5 each),
sourced via manual research, with a placeholder Associates tag
pending account approval per the approved seed-data design.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Verify the seeded data in the database

**Files:**
- None (read-only verification against the `dev.db` produced by Task 1)

**Interfaces:**
- Consumes: `dev.db` populated by Task 1's `npm run db:seed` run.

- [ ] **Step 1: Query product counts per category**

Run:

```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.product.groupBy({by:['category'],_count:{_all:true}}).then(r=>{console.log(r);return p.$disconnect();})"
```

Expected: 4 rows, one per category, each with `_count._all: 5` — `standing-desks`, `ergonomic-chairs`, `lighting`, `cable-management`.

- [ ] **Step 2: Confirm every affiliate link uses the placeholder tag**

Run:

```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.affiliateLink.count({where:{tracking_url:{not:{contains:'deskholt-pending'}}}}).then(r=>{console.log('links without placeholder tag:', r);return p.$disconnect();})"
```

Expected: `links without placeholder tag: 0`.

---

### Task 3: Verify the pages render the new data

**Files:**
- None (manual verification against the running dev server)

**Interfaces:**
- Consumes: the Next.js app (`npm run dev`) reading from the `dev.db` populated in Task 1.

- [ ] **Step 1: Start the dev server in the background**

Run: `npm run dev` (background/separate terminal)
Expected: `Ready` log line, server listening on `http://localhost:3000`.

- [ ] **Step 2: Check the homepage**

Run: `curl -s http://localhost:3000/ | grep -o "Standing Desks"`
Expected: at least one match (category card renders).

- [ ] **Step 3: Check each category page lists 5 products**

Run for each of the 4 slugs:

```bash
curl -s http://localhost:3000/category/standing-desks | grep -c "uplift-v2-standing-desk-bamboo-gray\|flexispot-e7-pro-standing-desk-black\|autonomous-smartdesk-dual-motor-white\|fully-jarvis-standing-desk-bamboo-48x30\|shw-48in-standing-desk-drawer-black"
```

Expected: `5` (repeat with the equivalent slug list for `ergonomic-chairs`, `lighting`, `cable-management` from Task 1's product list).

- [ ] **Step 4: Check a product detail page renders**

Run: `curl -s http://localhost:3000/products/uplift-v2-standing-desk-bamboo-gray | grep -o "UPLIFT V2 Standing Desk"`
Expected: match found, page returns 200 (no Next.js 404 boundary).

- [ ] **Step 5: Check the `/go/[slug]` redirect for a seeded product**

Run: `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/go/uplift-v2-standing-desk-bamboo-gray`
Expected: a `30x` status and a `redirect_url` starting with `https://www.amazon.com/dp/B01MU31LAW`.

- [ ] **Step 6: Stop the dev server**

Stop the background `npm run dev` process.
