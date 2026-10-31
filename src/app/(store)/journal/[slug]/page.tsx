import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCover, articleDate, categoryLabel } from "@/components/marketing/article-card";
import { CmsBody } from "@/components/marketing/cms-body";
import { JsonLd, siteUrl } from "@/components/marketing/json-ld";
import { pulse, Unavailable } from "@/components/store/sections";
import { htmlToText } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";
import { getArticle } from "@/modules/store/content";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const res = await getArticle(slug);
  if (res.ok && res.data === null) notFound();
  if (!res.ok) return { title: "The DRS Journal" };
  const a = res.data!;
  const title = a.meta_title || a.title;
  const description = a.meta_description || a.excerpt || htmlToText(a.body_html);
  const image = mediaUrl(a.cover_image_url);
  return {
    title: { absolute: title.includes("DRS") ? title : `${title} · DRS Journal` },
    description,
    alternates: { canonical: `/journal/${a.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: a.published_at ?? undefined,
      authors: a.author_name ? [a.author_name] : undefined,
      tags: a.tags ?? undefined,
      images: image ? [image] : undefined,
    },
  };
}

async function ArticleBody({ params }: { params: Params }) {
  const { slug } = await params;
  const res = await getArticle(slug);
  if (!res.ok) return <Unavailable what="this article" />;
  const a = res.data;
  if (!a) notFound();
  const url = `${siteUrl()}/journal/${a.slug}`;
  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt ?? htmlToText(a.body_html),
          datePublished: a.published_at ?? undefined,
          author: { "@type": a.author_name ? "Person" : "Organization", name: a.author_name ?? "DRS Dairy" },
          publisher: { "@type": "Organization", name: "DRS Dairy", url: siteUrl() },
          mainEntityOfPage: url,
          image: mediaUrl(a.cover_image_url) ?? undefined,
          keywords: a.tags?.join(", "),
        }}
      />
      <header className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">
          {categoryLabel(a.category)}
        </p>
        <h1 className="mt-2 text-[2rem] leading-tight font-semibold tracking-tight text-drs-green md:text-5xl">
          {a.title}
        </h1>
        {a.excerpt && <p className="mt-4 text-lg leading-relaxed text-drs-ink/80">{a.excerpt}</p>}
        <p className="mt-4 text-sm text-drs-ink/70">
          {[a.author_name, a.published_at && articleDate.format(new Date(a.published_at))]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>
      <ArticleCover article={a} priority className="mx-auto mt-8 max-w-4xl rounded-3xl" />
      <CmsBody html={a.body_html} className="mx-auto mt-10 max-w-3xl" />
      {!!a.tags?.length && (
        <ul aria-label="Tags" className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-2">
          {a.tags.map((t) => (
            <li key={t} className="rounded-full bg-drs-green/10 px-3 py-1 text-xs font-medium text-drs-green">
              #{t}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function ArticlePage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <nav aria-label="Breadcrumb" className="mx-auto mb-6 max-w-3xl">
        <Link
          href="/journal"
          className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-drs-ink/75 hover:text-drs-green hover:underline"
        >
          <ChevronLeftIcon aria-hidden className="size-4" /> The DRS Journal
        </Link>
      </nav>
      <Suspense
        fallback={
          <div aria-busy="true" aria-label="Loading article" className="mx-auto max-w-3xl space-y-4">
            <div className={cn(pulse, "h-4 w-24")} />
            <div className={cn(pulse, "h-12 w-3/4")} />
            <div className={cn(pulse, "aspect-[16/9]")} />
            <div className={cn(pulse, "h-40")} />
          </div>
        }
      >
        <ArticleBody params={params} />
      </Suspense>
    </div>
  );
}
