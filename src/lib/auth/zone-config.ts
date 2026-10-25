import "server-only";
import type { ZoneAuth } from "./handlers";
import { isAdminToken, isCustomerToken } from "./jwt";
import { REFRESH_PATH, STORE_REFRESH_PATH } from "./session";

export const ADMIN_AUTH: ZoneAuth = {
  allows: isAdminToken,
  denied: "This dashboard is for DRS admins only.",
  refreshPath: REFRESH_PATH,
};

export const STORE_AUTH: ZoneAuth = {
  allows: isCustomerToken,
  denied: "This sign-in is for DRS customers. Staff, please use the admin console.",
  refreshPath: STORE_REFRESH_PATH,
};
