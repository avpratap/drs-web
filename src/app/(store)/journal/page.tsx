import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/marketing/article-card";
import { pulse, Unavailable } from "@/components/store/sections";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getArticles } from "@/modules/store/content";

export const metadata: Metadata = {
  title: "The DRS Journal",
  description:
    "Recipes, nutrition and stories from the DRS dairy — how good milk is made and how to enjoy it.",
  alternates: { canonical: "/journal" },
  openGraph: { title: "The DRS Journal", type: "website" },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

async function Articles({ searchParams }: { searchParams: SP }) {
  const raw = (await searchParams).page;
  const page = Math.max(1, Number(Array.isArray(raw) ? raw[0] : raw) || 1);
  const res = await getArticles(page);
  if (!res.ok) return <Unavailable what="the journal" />;
  const { items, more } = res.data;
  if (!items.length)
    return (
      <p className="rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-12 text-center text-drs-ink/75">
        Our first stories are on their way. Check back soon.
      </p>
    );
  const [first, ...rest] = items;
  return (
    <>
      <ul aria-label="Articles" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <li className={cn(page === 1 && "md:col-span-2 lg:col-span-3")}>
          <ArticleCard article={first} featured={page === 1} />
        </li>
        {rest.map((a) => (
          <li key={a.id}>
            <ArticleCard article={a} />
          </li>
        ))}
      </ul>
      {(page > 1 || more) && (
        <nav aria-label="Journal pages" className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={page === 2 ? "/journal" : `/journal?page=${page - 1}`}
              rel="prev"
              className={buttonClass("secondary", "rounded-full")}
            >
              <ChevronLeftIcon aria-hidden className="size-4" /> Newer
            </Link>
          )}
          {more && (
            <Link
              href={`/journal?page=${page + 1}`}
              rel="next"
              className={buttonClass("secondary", "rounded-full")}
            >
              Older <ChevronRightIcon aria-hidden className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

function ArticlesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading articles" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <div className={cn(pulse, "h-72 md:col-span-2 lg:col-span-3")} />
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn(pulse, "h-72")} />
      ))}
    </div>
  );
}

export default function JournalPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 md:px-6 md:pt-14 md:pb-24">
      <header className="mb-8 max-w-2xl md:mb-12">
        <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">From the dairy</p>
        <h1 className="mt-2 text-[2rem] leading-tight font-semibold tracking-tight text-drs-green md:text-5xl">
          The DRS Journal
        </h1>
        <div aria-hidden className="mt-4 h-0.5 w-12 rounded bg-drs-gold" />
        <p className="mt-4 text-drs-ink/80 md:text-lg">
          Recipes, nutrition and stories about how good milk is made.
        </p>
      </header>
      <Suspense fallback={<ArticlesSkeleton />}>
        <Articles searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
