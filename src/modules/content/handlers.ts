import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { filterValue, num, pagedList, unwrap, type Handlers } from "@/lib/api/resource";

type S = components["schemas"];

export const contentHandlers: Handlers = {
  banners: {
    list: ({ pagination }) =>
      pagedList(pagination, (page) => api.GET("/api/v1/admin/content/banners", { params: { query: page } })),
    one: (id) =>
      unwrap(
        api.GET("/api/v1/admin/content/banners/{banner_id}", { params: { path: { banner_id: num(id) } } }),
      ),
    create: (v) => unwrap(api.POST("/api/v1/admin/content/banners", { body: v as S["BannerIn"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/content/banners/{banner_id}", {
          params: { path: { banner_id: num(id) } },
          body: v as S["BannerUpdate"],
        }),
      ),
    async remove(id) {
      await unwrap(
        api.DELETE("/api/v1/admin/content/banners/{banner_id}", { params: { path: { banner_id: num(id) } } }),
      );
    },
  },
  articles: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/content/articles", {
          params: { query: { ...page, status_filter: filterValue(filters, "status") } },
        }),
      ),
    one: (id) =>
      unwrap(
        api.GET("/api/v1/admin/content/articles/{article_id}", { params: { path: { article_id: num(id) } } }),
      ),
    create: (v) => unwrap(api.POST("/api/v1/admin/content/articles", { body: v as S["ArticleIn"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/content/articles/{article_id}", {
          params: { path: { article_id: num(id) } },
          body: v as S["ArticleUpdate"],
        }),
      ),
    async remove(id) {
      await unwrap(
        api.DELETE("/api/v1/admin/content/articles/{article_id}", {
          params: { path: { article_id: num(id) } },
        }),
      );
    },
  },
  pages: {
    list: ({ pagination }) =>
      pagedList(pagination, (page) => api.GET("/api/v1/admin/content/pages", { params: { query: page } })),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/content/pages/{page_id}", { params: { path: { page_id: num(id) } } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/content/pages", { body: v as S["PageIn"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/content/pages/{page_id}", {
          params: { path: { page_id: num(id) } },
          body: v as S["PageUpdate"],
        }),
      ),
    async remove(id) {
      await unwrap(
        api.DELETE("/api/v1/admin/content/pages/{page_id}", { params: { path: { page_id: num(id) } } }),
      );
    },
  },
  newsletter: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/newsletter/subscribers", {
          params: { query: { ...page, status_filter: filterValue(filters, "status") } },
        }),
      ),
  },
};

export const contentActions = {
  publishArticle: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/content/articles/{article_id}/publish", {
        params: { path: { article_id: id } },
      }),
    ),
  unpublishArticle: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/content/articles/{article_id}/unpublish", {
        params: { path: { article_id: id } },
      }),
    ),
  publishPage: (id: number) =>
    unwrap(api.POST("/api/v1/admin/content/pages/{page_id}/publish", { params: { path: { page_id: id } } })),
  unpublishPage: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/content/pages/{page_id}/unpublish", { params: { path: { page_id: id } } }),
    ),
};
