import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/lib/api/server";
import type { components } from "@/lib/api/client";
import { failed, type Loaded } from "./catalog";

export type Article = components["schemas"]["ArticleOut"];
export type CmsPage = components["schemas"]["PageOut"];
export type Banner = components["schemas"]["BannerOut"];

export const JOURNAL_PAGE_SIZE = 12;

/**
 * Public CMS reads (journal, static pages, promo banners), fetched on the server and cached
 * for a few minutes. Failures return `failed()` (short-lived, retried) so pages degrade calmly; a missing
 * article/page is `{ ok: true, data: null }`.
 */
export async function getArticles(page = 1): Promise<Loaded<{ items: Article[]; more: boolean }>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("content");
  try {
    const { data, response } = await serverApi().GET("/api/v1/content/articles", {
      params: {
        query: { limit: JOURNAL_PAGE_SIZE + 1, offset: (Math.max(1, page) - 1) * JOURNAL_PAGE_SIZE },
      },
    });
    if (!response.ok || !data) return failed();
    return {
      ok: true,
      data: { items: data.slice(0, JOURNAL_PAGE_SIZE), more: data.length > JOURNAL_PAGE_SIZE },
    };
  } catch {
    return failed();
  }
}

export async function getArticle(slug: string): Promise<Loaded<Article | null>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("content", `article-${slug}`);
  try {
    const { data, response } = await serverApi().GET("/api/v1/content/articles/{slug}", {
      params: { path: { slug } },
    });
    if (response.status === 404) return { ok: true, data: null };
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
  }
}

export async function getCmsPage(slug: string): Promise<Loaded<CmsPage | null>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("content", `page-${slug}`);
  try {
    const { data, response } = await serverApi().GET("/api/v1/content/pages/{slug}", {
      params: { path: { slug } },
    });
    if (response.status === 404) return { ok: true, data: null };
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
  }
}

export async function getBanners(): Promise<Loaded<Banner[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("content", "banners");
  try {
    const { data, response } = await serverApi().GET("/api/v1/content/banners");
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
  }
}
