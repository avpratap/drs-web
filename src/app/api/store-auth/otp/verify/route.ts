import { otpVerifyHandler } from "@/lib/auth/handlers";
import { STORE_AUTH } from "@/lib/auth/zone-config";

/** Storefront sign-in: customers and B2B subscribers only (admins use /admin/login). */
export const POST = otpVerifyHandler(STORE_AUTH);
