import { ArrowRightIcon, FeatherIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { htmlToText } from "@/lib/sanitize";
import { getCmsPage } from "@/modules/store/content";
import { CmsBody } from "./cms-body";

export type CmsRoute = {
  slug: string;
  /** Shown (and used for metadata) until the CMS has the page. */
  title: string;
  description: string;
  eyebrow: string;
};

const updated = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

export async function cmsMetadata(route: CmsRoute): Promise<Metadata> {
  const res = await getCmsPage(route.slug);
  const page = res.ok ? res.data : null;
  const title = page?.meta_title || page?.title || route.title;
  const description = page?.meta_description || (page ? htmlToText(page.body_html) : route.description);
  return {
    title,
    description,
    alternates: { canonical: `/${route.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

/**
 * A static page from the CMS (GET /content/pages/{slug}), sanitized and styled. Until the
 * page is published it shows a calm "coming soon" with useful next steps instead of a 404.
 */
export async function CmsPageView({ route }: { route: CmsRoute }) {
  const res = await getCmsPage(route.slug);
  const page = res.ok ? res.data : null;
  return (
    <article className="mx-auto max-w-3xl px-4 pt-8 pb-16 md:px-6 md:pt-14 md:pb-24">
      <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">{route.eyebrow}</p>
      <h1 className="mt-2 text-[2rem] leading-tight font-semibold tracking-tight text-drs-green md:text-5xl">
        {page?.title ?? route.title}
      </h1>
      <div aria-hidden className="mt-4 h-0.5 w-12 rounded bg-drs-gold" />
      {page ? (
        <>
          {page.published_at && (
            <p className="mt-4 text-sm text-drs-ink/70">
              Last updated {updated.format(new Date(page.published_at))}
            </p>
          )}
          <CmsBody html={page.body_html} className="mt-8" />
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-drs-ink/10 bg-drs-white p-6 shadow-sm md:p-8">
          <FeatherIcon aria-hidden className="size-8 text-drs-green" strokeWidth={1.5} />
          <h2 className="mt-3 text-xl font-semibold text-drs-ink">We&apos;re writing this page</h2>
          <p className="mt-1 text-drs-ink/80">
            {res.ok
              ? `${route.description} It'll be here very soon.`
              : "We couldn't load this page just now. Please try again in a moment."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/account/support" className={buttonClass("primary", "px-5", "pill")}>
              Ask us a question <ArrowRightIcon aria-hidden className="size-4" />
            </Link>
            <Link href="/products" className={buttonClass("secondary", "rounded-full px-5")}>
              Shop fresh dairy
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
