// ============================================================================
// DESKHOLT — SEED: Standing Desk Attributes v1-alpha
//
// Chạy: npx prisma db seed  (hoặc  npx tsx prisma/seed.ts)
//
// Script này làm 3 việc, theo đúng thứ tự (chạy lại nhiều lần AN TOÀN — dùng
// upsert nên không tạo trùng):
//   1. Tạo Category "standing-desks" nếu chưa có.
//   2. Tạo 35 AttributeDefinition (từ điển thuộc tính) nếu chưa có.
//   3. Gắn từng attribute vào Category qua CategoryAttribute — đây là chỗ
//      quyết định "Standing Desk schema" thật sự dùng những field nào.
//
// LƯU Ý CHO NGƯỜI MỚI:
// - "upsert" nghĩa là: nếu record đã tồn tại (theo `where`) thì update,
//   nếu chưa có thì tạo mới. An toàn để chạy lại seed nhiều lần.
// - Attribute nhóm DERIVED-QUESTIONABLE được đánh dấu rõ bằng comment ngay
//   cạnh, và cố ý không set isRequired=true — vì đây là dữ liệu suy luận,
//   không phải số đo/thông số từ nhà sản xuất.
// ============================================================================

import { PrismaClient, AttributeDataType, AttributeScope } from "@prisma/client";

const prisma = new PrismaClient();

// ----------------------------------------------------------------------
// Kiểu dữ liệu mô tả 1 attribute cần seed — chỉ dùng nội bộ trong file này,
// không phải model Prisma.
//
// `scope` (R2): PRODUCT = nhập ở Product; VARIANT = nhập riêng từng biến
// thể; DERIVED = suy luận/đánh giá, KHÔNG phải số đo thô từ nhà sản xuất.
// Admin phải đọc field này để quyết định form hiển thị, không hardcode key.
// ----------------------------------------------------------------------
type AttributeSeed = {
  key: string;
  label: string;
  scope: AttributeScope;
  dataType: AttributeDataType;
  unit?: string;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean; // dùng khi tạo CategoryAttribute, không phải AttributeDefinition
  allowedValues?: string[]; // chỉ có khi dataType = ENUM
};

// ----------------------------------------------------------------------
// Danh sách 35 attribute — thứ tự trong mảng = displayOrder khi hiển thị
// trong Admin (editor sẽ thấy đúng theo thứ tự này).
// ----------------------------------------------------------------------
const STANDING_DESK_ATTRIBUTES: AttributeSeed[] = [
  // --- Dimensions (Product-level) ---
  { key: "min_height_mm", label: "Minimum Height", scope: "PRODUCT", dataType: "DECIMAL", unit: "mm", isFilterable: true, isComparable: true, isRequired: true },
  { key: "max_height_mm", label: "Maximum Height", scope: "PRODUCT", dataType: "DECIMAL", unit: "mm", isFilterable: true, isComparable: true, isRequired: true },
  { key: "max_load_kg", label: "Maximum Load Capacity", scope: "PRODUCT", dataType: "DECIMAL", unit: "kg", isFilterable: true, isComparable: true, isRequired: true },
  { key: "product_weight_kg", label: "Product Weight", scope: "PRODUCT", dataType: "DECIMAL", unit: "kg", isFilterable: false, isComparable: true, isRequired: false },

  // --- Desktop dimensions (Variant-level — khác size = khác variant) ---
  { key: "desktop_width_mm", label: "Desktop Width", scope: "VARIANT", dataType: "DECIMAL", unit: "mm", isFilterable: true, isComparable: true, isRequired: true },
  { key: "desktop_depth_mm", label: "Desktop Depth", scope: "VARIANT", dataType: "DECIMAL", unit: "mm", isFilterable: true, isComparable: true, isRequired: true },
  { key: "desktop_thickness_mm", label: "Desktop Thickness", scope: "PRODUCT", dataType: "DECIMAL", unit: "mm", isFilterable: false, isComparable: true, isRequired: false },

  // --- Mechanism (Product-level) ---
  // R2: adjustment_type trước đây lẫn cả SINGLE_MOTOR/DUAL_MOTOR/TRIPLE_MOTOR
  // — trùng ngữ nghĩa với motor_count bên dưới. Giờ tách rõ: adjustment_type
  // = cơ chế nâng hạ; motor_count = số lượng motor (chỉ có ý nghĩa khi
  // adjustment_type = ELECTRIC).
  {
    key: "adjustment_type",
    label: "Adjustment Type",
    scope: "PRODUCT",
    dataType: "ENUM",
    isFilterable: true,
    isComparable: true,
    isRequired: true,
    allowedValues: ["ELECTRIC", "MANUAL_CRANK", "PNEUMATIC", "FIXED"],
  },
  { key: "motor_count", label: "Motor Count", scope: "PRODUCT", dataType: "INTEGER", isFilterable: true, isComparable: true, isRequired: true },
  { key: "lifting_speed_mm_s", label: "Lifting Speed", scope: "PRODUCT", dataType: "DECIMAL", unit: "mm/s", isFilterable: false, isComparable: true, isRequired: false },
  { key: "noise_db", label: "Noise Level", scope: "PRODUCT", dataType: "DECIMAL", unit: "dB", isFilterable: false, isComparable: true, isRequired: false },
  { key: "anti_collision", label: "Anti-Collision", scope: "PRODUCT", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },
  { key: "memory_presets", label: "Memory Presets", scope: "PRODUCT", dataType: "INTEGER", isFilterable: false, isComparable: true, isRequired: false },

  // --- Frame (Product-level) ---
  { key: "leg_count", label: "Leg Count", scope: "PRODUCT", dataType: "INTEGER", isFilterable: true, isComparable: false, isRequired: false },
  {
    key: "leg_design",
    label: "Leg Design",
    scope: "PRODUCT",
    dataType: "ENUM",
    isFilterable: true,
    isComparable: false,
    isRequired: false,
    allowedValues: ["SINGLE_LEG", "DUAL_LEG", "C_SHAPE", "T_SHAPE"],
  },
  {
    key: "frame_material",
    label: "Frame Material",
    scope: "PRODUCT",
    dataType: "ENUM",
    isFilterable: true,
    isComparable: true,
    isRequired: false,
    allowedValues: ["STEEL", "ALUMINUM"],
  },
  { key: "frame_width_min_mm", label: "Frame Width (Min)", scope: "PRODUCT", dataType: "DECIMAL", unit: "mm", isFilterable: false, isComparable: true, isRequired: false },
  { key: "frame_width_max_mm", label: "Frame Width (Max)", scope: "PRODUCT", dataType: "DECIMAL", unit: "mm", isFilterable: false, isComparable: true, isRequired: false },
  { key: "crossbar", label: "Has Crossbar", scope: "PRODUCT", dataType: "BOOLEAN", isFilterable: false, isComparable: false, isRequired: false },
  { key: "casters_compatible", label: "Casters Compatible", scope: "PRODUCT", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },

  // --- Desktop (mix Product/Variant) ---
  { key: "desktop_included", label: "Desktop Included", scope: "PRODUCT", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: true },
  {
    key: "desktop_shape",
    label: "Desktop Shape",
    scope: "PRODUCT",
    dataType: "ENUM",
    isFilterable: true,
    isComparable: false,
    isRequired: false,
    allowedValues: ["RECTANGULAR", "L_SHAPED", "CURVED"],
  },
  {
    key: "desktop_material",
    label: "Desktop Material",
    scope: "VARIANT",
    dataType: "ENUM",
    isFilterable: true,
    isComparable: true,
    isRequired: false,
    allowedValues: ["MDF", "BAMBOO", "SOLID_WOOD", "LAMINATE"],
  },
  { key: "desktop_finish", label: "Desktop Finish", scope: "VARIANT", dataType: "STRING", isFilterable: false, isComparable: false, isRequired: false },
  { key: "frame_color", label: "Frame Color", scope: "VARIANT", dataType: "STRING", isFilterable: true, isComparable: false, isRequired: false },

  // --- Warranty & Certifications (Product-level) ---
  { key: "warranty_months", label: "Warranty", scope: "PRODUCT", dataType: "INTEGER", unit: "months", isFilterable: true, isComparable: true, isRequired: true },
  { key: "certification_greenguard", label: "GREENGUARD Certified", scope: "PRODUCT", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },
  { key: "certification_bifma", label: "BIFMA Certified", scope: "PRODUCT", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },
  { key: "assembly_time_minutes", label: "Assembly Time", scope: "PRODUCT", dataType: "INTEGER", unit: "minutes", isFilterable: false, isComparable: true, isRequired: false },

  // --- DERIVED / QUESTIONABLE ------------------------------------------
  // Đây KHÔNG phải số đo thô — là suy luận/đánh giá. Cố ý isRequired=false.
  // scope="DERIVED" để Admin có thể tự động khoanh vùng/cảnh báo riêng nhóm
  // này, không cần hardcode danh sách key. Sau 10 sản phẩm thật, quyết định:
  // giữ làm Attribute, hay chuyển thành Verdict/Finding do editor viết tay
  // có căn cứ (V2).
  { key: "monitor_arm_compatible", label: "Monitor Arm Compatible", scope: "DERIVED", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },
  { key: "dual_monitor_suitable", label: "Dual Monitor Suitable", scope: "DERIVED", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },
  { key: "ultrawide_suitable", label: "Ultrawide Suitable", scope: "DERIVED", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },
  { key: "keyboard_tray_compatible", label: "Keyboard Tray Compatible", scope: "DERIVED", dataType: "BOOLEAN", isFilterable: true, isComparable: false, isRequired: false },
  {
    key: "assembly_difficulty",
    label: "Assembly Difficulty",
    scope: "DERIVED",
    dataType: "ENUM",
    isFilterable: false,
    isComparable: true,
    isRequired: false,
    allowedValues: ["EASY", "MODERATE", "HARD"],
  },
  {
    key: "stability_rating",
    label: "Stability",
    scope: "DERIVED",
    dataType: "ENUM",
    isFilterable: false,
    isComparable: true,
    isRequired: false,
    allowedValues: ["LOW", "MEDIUM", "HIGH"],
  },
];

async function main() {
  console.log("🌱 Seeding: Standing Desk Attributes v1-alpha");

  // 1. Category ------------------------------------------------------------
  const category = await prisma.category.upsert({
    where: { slug: "standing-desks" },
    update: {},
    create: {
      slug: "standing-desks",
      name: "Standing Desks",
      description: "Height-adjustable standing desks for home and office workspaces.",
      isActive: true,
    },
  });
  console.log(`✔ Category ready: ${category.name} (id=${category.id})`);

  // 2 + 3. AttributeDefinition + CategoryAttribute -------------------------
  // Chạy tuần tự (không Promise.all) để displayOrder theo đúng thứ tự mảng
  // và log dễ đọc khi có lỗi ở giữa chừng.
  for (let i = 0; i < STANDING_DESK_ATTRIBUTES.length; i++) {
    const attr = STANDING_DESK_ATTRIBUTES[i];

    const definition = await prisma.attributeDefinition.upsert({
      where: { key: attr.key },
      update: {
        label: attr.label,
        scope: attr.scope,
        dataType: attr.dataType,
        unit: attr.unit,
        isFilterable: attr.isFilterable,
        isComparable: attr.isComparable,
        allowedValues: attr.allowedValues ?? undefined,
      },
      create: {
        key: attr.key,
        label: attr.label,
        scope: attr.scope,
        dataType: attr.dataType,
        unit: attr.unit,
        isFilterable: attr.isFilterable,
        isComparable: attr.isComparable,
        allowedValues: attr.allowedValues ?? undefined,
      },
    });

    await prisma.categoryAttribute.upsert({
      where: {
        categoryId_attributeDefinitionId: {
          categoryId: category.id,
          attributeDefinitionId: definition.id,
        },
      },
      update: {
        isRequired: attr.isRequired,
        displayOrder: i,
      },
      create: {
        categoryId: category.id,
        attributeDefinitionId: definition.id,
        isRequired: attr.isRequired,
        displayOrder: i,
      },
    });

    console.log(`  ✔ [${i + 1}/${STANDING_DESK_ATTRIBUTES.length}] ${attr.key}`);
  }

  console.log("✅ Done. Standing Desk schema v1-alpha seeded.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
