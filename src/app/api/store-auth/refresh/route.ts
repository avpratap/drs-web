import { refreshHandler } from "@/lib/auth/handlers";
import { STORE_AUTH } from "@/lib/auth/zone-config";

export const POST = refreshHandler(STORE_AUTH);
