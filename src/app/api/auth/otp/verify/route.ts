import { otpVerifyHandler } from "@/lib/auth/handlers";
import { ADMIN_AUTH } from "@/lib/auth/zone-config";

/** Admin console sign-in: only role=admin gets a session. */
export const POST = otpVerifyHandler(ADMIN_AUTH);
