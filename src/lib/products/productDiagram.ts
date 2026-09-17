import { prisma } from '@/lib/prisma';

export const DIAGRAM_ROUTE_PREFIX = '/api/product-diagram/';

const REQUIRED_ATTRIBUTE_KEYS = [
  'desktop_width_in',
  'desktop_depth_in',
  'min_height_in',
  'max_height_in',
  'max_load_lb',
] as const;

const OPTIONAL_ATTRIBUTE_KEYS = ['frame_color', 'desktop_material'] as const;

export type DiagramDimensions = {
  desktopWidthIn: number;
  desktopDepthIn: number;
  minHeightIn: number;
  maxHeightIn: number;
  maxLoadLb: number;
  frameColor?: string;
  desktopMaterial?: string;
};

export type DiagramEligibility =
  | { eligible: true; dimensions: DiagramDimensions }
  | { eligible: false; missing: string[] };

type DiagramAttributeRow = {
  variant_id: string | null;
  value_number: unknown;
  value_string: string | null;
  confidence: 'VERIFIED' | 'LIKELY' | 'UNVERIFIED';
  attribute_definition: { key: string };
};

export type ProductDiagramStore = {
  productVariant: {
    findFirst(input: {
      where: { product_id: string; is_active: true };
      orderBy: { created_at: 'asc' };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
  productAttribute: {
    findMany(input: {
      where: {
        product_id: string;
        attribute_definition: { key: { in: string[] } };
      };
      include: { attribute_definition: { select: { key: true } } };
    }): Promise<DiagramAttributeRow[]>;
  };
};

export function isDiagramUrl(imageUrl: string): boolean {
  return imageUrl.startsWith(DIAGRAM_ROUTE_PREFIX);
}

export async function getDiagramEligibility(
  productId: string,
  store: ProductDiagramStore = prisma
): Promise<DiagramEligibility> {
  const activeVariant = await store.productVariant.findFirst({
    where: { product_id: productId, is_active: true },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });
  const attributes = await store.productAttribute.findMany({
    where: {
      product_id: productId,
      attribute_definition: {
        key: { in: [...REQUIRED_ATTRIBUTE_KEYS, ...OPTIONAL_ATTRIBUTE_KEYS] },
      },
    },
    include: { attribute_definition: { select: { key: true } } },
  });

  const verified = attributes.filter((attribute) => attribute.confidence === 'VERIFIED');
  const productNumber = (key: string) => {
    const row = verified.find((attribute) =>
      attribute.variant_id === null && attribute.attribute_definition.key === key
    );
    return row?.value_number === null || row?.value_number === undefined
      ? undefined
      : Number(row.value_number);
  };
  const variantNumber = (key: string) => {
    if (!activeVariant) return undefined;
    const row = verified.find((attribute) =>
      attribute.variant_id === activeVariant.id && attribute.attribute_definition.key === key
    );
    return row?.value_number === null || row?.value_number === undefined
      ? undefined
      : Number(row.value_number);
  };
  const variantString = (key: string) => {
    if (!activeVariant) return undefined;
    return verified.find((attribute) =>
      attribute.variant_id === activeVariant.id && attribute.attribute_definition.key === key
    )?.value_string ?? undefined;
  };

  const values = {
    desktopWidthIn: variantNumber('desktop_width_in'),
    desktopDepthIn: variantNumber('desktop_depth_in'),
    minHeightIn: productNumber('min_height_in'),
    maxHeightIn: productNumber('max_height_in'),
    maxLoadLb: productNumber('max_load_lb'),
  };
  const missing = Object.entries(values)
    .filter(([, value]) => value === undefined || !Number.isFinite(value))
    .map(([key]) => key);
  if (missing.length > 0) return { eligible: false, missing };

  return {
    eligible: true,
    dimensions: {
      desktopWidthIn: values.desktopWidthIn!,
      desktopDepthIn: values.desktopDepthIn!,
      minHeightIn: values.minHeightIn!,
      maxHeightIn: values.maxHeightIn!,
      maxLoadLb: values.maxLoadLb!,
      ...(variantString('frame_color') ? { frameColor: variantString('frame_color') } : {}),
      ...(variantString('desktop_material')
        ? { desktopMaterial: variantString('desktop_material') }
        : {}),
    },
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function renderDiagramSvg(dimensions: DiagramDimensions, productName: string): string {
  const width = formatNumber(dimensions.desktopWidthIn);
  const depth = formatNumber(dimensions.desktopDepthIn);
  const minHeight = formatNumber(dimensions.minHeightIn);
  const maxHeight = formatNumber(dimensions.maxHeightIn);
  const maxLoad = formatNumber(dimensions.maxLoadLb);
  const enrichment = [dimensions.desktopMaterial, dimensions.frameColor].filter(Boolean).join(' · ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(productName)} technical diagram</title>
  <desc id="desc">DeskHolt editorial specification diagram, not an official product photo.</desc>
  <rect width="1200" height="800" fill="#f4f7fa"/>
  <g fill="none" stroke="#155e75" stroke-width="4">
    <rect x="260" y="240" width="680" height="120" rx="8" fill="#dbeafe"/>
    <path d="M340 360v260M860 360v260M300 620h600"/>
    <path d="M260 190h680M260 170v40M940 170v40"/>
    <path d="M980 240v120M960 240h40M960 360h40"/>
    <path d="M210 240v380M190 240h40M190 620h40"/>
  </g>
  <g fill="#0f3d5e" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">
    <text x="600" y="130" font-size="24" font-weight="700">DESKHOLT TECHNICAL DIAGRAM</text>
    <text x="600" y="165" font-size="20">${escapeXml(productName)}</text>
    <text x="600" y="185" font-size="14">EDITORIAL ILLUSTRATION · NOT AN OFFICIAL PRODUCT PHOTO</text>
    <text x="600" y="180" dy="80" font-size="22">${width} in width</text>
    <text x="1040" y="310" font-size="22">${depth} in depth</text>
    <text x="115" y="425" font-size="22" transform="rotate(-90 115 425)">${minHeight}–${maxHeight} in height</text>
    <text x="600" y="455" font-size="24" font-weight="700">MAX LOAD ${maxLoad} lb</text>
    ${enrichment ? `<text x="600" y="500" font-size="18">${escapeXml(enrichment)}</text>` : ''}
  </g>
</svg>`;
}
