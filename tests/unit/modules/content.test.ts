import { describe, expect, it } from "vitest";
import { contentActions } from "@/modules/content/handlers";
import { dataProvider, mockApi } from "../../helpers";

describe("content handlers", () => {
  it("banner/article/page CRUD", async () => {
    const api = mockApi([
      { method: "POST", path: /\/api\/v1\/admin\/content\/(banners|articles|pages)$/, body: { id: 1 } },
      { method: "PATCH", path: /\/api\/v1\/admin\/content\/(banners|articles|pages)\/1$/, body: { id: 1 } },
      { method: "DELETE", path: /\/api\/v1\/admin\/content\/(banners|articles|pages)\/1$/, status: 204 },
      { path: /\/api\/v1\/admin\/content\/(banners|articles|pages)\/1$/, body: { id: 1 } },
      { path: /\/api\/v1\/admin\/content\/(banners|articles|pages)$/, body: [] },
    ]);
    for (const resource of ["banners", "articles", "pages"]) {
      await dataProvider.getList({ resource });
      await dataProvider.getOne({ resource, id: 1 });
      await dataProvider.create({ resource, variables: { title: "t" } });
      await dataProvider.update({ resource, id: 1, variables: { title: "u" } });
      await dataProvider.deleteOne({ resource, id: 1 });
    }
    expect(api.calls).toHaveLength(15);
    expect(api.calls.every((c) => c.path.startsWith("/api/v1/admin/content/"))).toBe(true);
  });

  it("article status filter, newsletter, publish toggles", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/content/articles", body: [] },
      { path: "/api/v1/admin/newsletter/subscribers", body: [] },
      { method: "POST", path: /\/(publish|unpublish)$/, body: {} },
    ]);
    await dataProvider.getList({
      resource: "articles",
      filters: [{ field: "status", operator: "eq", value: "draft" }],
    });
    await dataProvider.getList({
      resource: "newsletter",
      filters: [{ field: "status", operator: "eq", value: "subscribed" }],
    });
    await contentActions.publishArticle(3);
    await contentActions.unpublishArticle(3);
    await contentActions.publishPage(4);
    await contentActions.unpublishPage(4);
    expect(api.calls[0].query.get("status_filter")).toBe("draft");
    expect(api.calls[1].query.get("status_filter")).toBe("subscribed");
    expect(api.calls.slice(2).map((c) => c.path)).toEqual([
      "/api/v1/admin/content/articles/3/publish",
      "/api/v1/admin/content/articles/3/unpublish",
      "/api/v1/admin/content/pages/4/publish",
      "/api/v1/admin/content/pages/4/unpublish",
    ]);
  });
});
