import type { Handlers } from "@/lib/api/resource";
import { billingHandlers } from "./billing/handlers";
import { catalogHandlers } from "./catalog/handlers";
import { contentHandlers } from "./content/handlers";
import { customerHandlers } from "./customers/handlers";
import { deliveryHandlers } from "./delivery/handlers";
import { inventoryHandlers } from "./inventory/handlers";
import { operationsHandlers } from "./operations/handlers";
import { reportHandlers } from "./reports/handlers";
import { systemHandlers } from "./system/handlers";

/** Every Refine resource → typed API handler. Keys are resource names. */
export const handlers: Handlers = {
  ...catalogHandlers,
  ...billingHandlers,
  ...inventoryHandlers,
  ...deliveryHandlers,
  ...reportHandlers,
  ...contentHandlers,
  ...customerHandlers,
  ...systemHandlers,
  ...operationsHandlers,
};
