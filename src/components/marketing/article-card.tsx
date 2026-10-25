import { BookOpenIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/modules/delivery/actions";
import type { Article } from "@/modules/store/content";

export const articleDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
export const categoryLabel = (c: string | null | undefined) =>
  c ? c.replace(/[_-]+/g, " ").replace(/^\w/, (x) => x.toUpperCase()) : "Journal";

/** Article cover: the CMS image, or an on-brand placeholder. */
export function ArticleCover({
  article,
  priority,
  className,
}: {
  article: Article;
  priority?: boolean;
  className?: string;
}) {
  const src = mediaUrl(article.cover_image_url);
  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden bg-drs-green", className)}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 40rem, 100vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="grid size-20 place-items-center rounded-full border border-drs-gold/60 text-drs-cream">
            <BookOpenIcon className="size-9" strokeWidth={1.25} />
          </span>
        </span>
      )}
    </div>
  );
}

export function ArticleCard({ article, featured }: { article: Article; featured?: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-drs-ink/10 bg-drs-white shadow-sm transition-shadow hover:shadow-md",
        featured && "md:grid md:grid-cols-2",
      )}
    >
      <ArticleCover
        article={article}
        priority={featured}
        className={featured ? "md:aspect-auto md:h-full" : undefined}
      />
      <div className={cn("flex flex-1 flex-col p-5", featured && "md:justify-center md:p-8")}>
        <p className="text-xs font-semibold tracking-[0.16em] text-drs-ink/70 uppercase">
          {categoryLabel(article.category)}
        </p>
        <h2
          className={cn(
            "mt-2 leading-snug font-semibold text-drs-ink",
            featured ? "text-2xl md:text-3xl" : "text-lg",
          )}
        >
          <Link
            href={`/journal/${article.slug}`}
            className="after:absolute after:inset-0 group-hover:text-drs-green"
          >
            {article.title}
          </Link>
        </h2>
        {article.excerpt && <p className="mt-2 text-sm leading-relaxed text-drs-ink/75">{article.excerpt}</p>}
        <p className="mt-auto pt-4 text-xs text-drs-ink/70">
          {[article.author_name, article.published_at && articleDate.format(new Date(article.published_at))]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </article>
  );
}
