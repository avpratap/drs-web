import { refreshHandler } from "@/lib/auth/handlers";
import { ADMIN_AUTH } from "@/lib/auth/zone-config";

export const POST = refreshHandler(ADMIN_AUTH);
