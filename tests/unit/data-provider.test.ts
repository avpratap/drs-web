import { describe, expect, it } from "vitest";
import { createDataProvider } from "@/providers/data-provider";
import { handlers } from "@/modules/registry";
import { resources } from "@/modules/resources";

describe("data provider", () => {
  const dp = createDataProvider({
    things: { list: async () => ({ data: [{ id: 1 }], total: 1 }), one: async (id) => ({ id, name: "x" }) },
  });

  it("routes to the resource's handler", async () => {
    expect(await dp.getList({ resource: "things" })).toEqual({ data: [{ id: 1 }], total: 1 });
    expect(await dp.getOne({ resource: "things", id: 3 })).toEqual({ data: { id: 3, name: "x" } });
    expect(await dp.getMany!({ resource: "things", ids: [1, 2] })).toEqual({
      data: [
        { id: 1, name: "x" },
        { id: 2, name: "x" },
      ],
    });
  });

  it("rejects unknown resources and unsupported operations with HttpErrors", async () => {
    await expect(dp.getList({ resource: "nope" })).rejects.toMatchObject({ statusCode: 400 });
    await expect(dp.create({ resource: "things", variables: {} })).rejects.toMatchObject({ statusCode: 405 });
    await expect(dp.update({ resource: "things", id: 1, variables: {} })).rejects.toMatchObject({
      statusCode: 405,
    });
    await expect(dp.deleteOne({ resource: "things", id: 1 })).rejects.toMatchObject({ statusCode: 405 });
  });

  it("every routed Refine resource has a handler", () => {
    for (const r of resources) expect(handlers[r.name], r.name).toBeDefined();
  });
});
