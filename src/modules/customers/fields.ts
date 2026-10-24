import type { FieldDef } from "@/components/resource/fields";
import { OPTIONS } from "@/modules/options";

export const couponFields: FieldDef[] = [
  {
    name: "code",
    label: "Code",
    required: true,
    minLength: 3,
    maxLength: 32,
    uppercase: true,
    createOnly: true,
    pattern: { value: /^[A-Za-z0-9_-]+$/, message: "Letters, digits, _ and - only" },
  },
  {
    name: "discount_type",
    label: "Discount type",
    type: "select",
    options: OPTIONS.discountType,
    required: true,
    createOnly: true,
  },
  {
    name: "value",
    label: "Value",
    type: "number",
    required: true,
    gt: 0,
    max: 1_000_000,
    hint: "Percent (1–100) or flat ₹",
    validate: (v, all) =>
      all.discount_type !== "percent" || (v as number) <= 100 || "A percentage can't exceed 100",
  },
  {
    name: "max_discount",
    label: "Max discount (₹)",
    type: "money",
    min: 0,
    max: 1_000_000,
    hint: "Cap for percent coupons",
    nullable: true,
  },
  { name: "min_order_value", label: "Minimum order (₹)", type: "money", min: 0, max: 1_000_000 },
  {
    name: "usage_limit",
    label: "Total uses",
    type: "number",
    step: 1,
    min: 1,
    hint: "Blank = unlimited",
    nullable: true,
  },
  {
    name: "per_user_limit",
    label: "Uses per customer",
    type: "number",
    step: 1,
    min: 1,
    hint: "Blank = unlimited",
    nullable: true,
  },
  { name: "valid_from", label: "Valid from", type: "date", nullable: true },
  {
    name: "valid_to",
    label: "Valid until",
    type: "date",
    nullable: true,
    validate: (v, all) =>
      !v || !all.valid_from || (v as string) >= (all.valid_from as string) || "Ends before it starts",
  },
  { name: "active", label: "Active", type: "checkbox", editOnly: true },
];
