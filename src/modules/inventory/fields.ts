import type { FieldDef } from "@/components/resource/fields";
import { OPTIONS } from "@/modules/options";

export const locationFields: FieldDef[] = [
  { name: "name", label: "Name", required: true, maxLength: 120 },
  {
    name: "kind",
    label: "Kind",
    type: "select",
    options: OPTIONS.locationKind,
    required: true,
    createOnly: true,
  },
  { name: "state", label: "State", maxLength: 64, createOnly: true, hint: "Used for GST place of supply" },
  {
    name: "driver_user_id",
    label: "Driver user #",
    type: "number",
    min: 1,
    hint: "For vehicle locations",
    nullable: true,
  },
  { name: "status", label: "Status", type: "select", options: OPTIONS.activeInactive, editOnly: true },
  { name: "is_default", label: "Default location", type: "checkbox", createOnly: true },
];

export const supplierFields: FieldDef[] = [
  { name: "name", label: "Name", required: true, maxLength: 255 },
  {
    name: "gstin",
    label: "GSTIN",
    maxLength: 15,
    uppercase: true,
    pattern: {
      value: /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9A-Za-z]Z[0-9A-Za-z]$/,
      message: "Not a valid GSTIN",
    },
  },
  { name: "contact_phone", label: "Phone", type: "tel", maxLength: 16 },
  { name: "contact_email", label: "Email", type: "email", maxLength: 255 },
  { name: "state", label: "State", maxLength: 64 },
  { name: "address", label: "Address", type: "textarea", maxLength: 500 },
];
