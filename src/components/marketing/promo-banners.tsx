import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/modules/delivery/actions";
import { getBanners, type Banner } from "@/modules/store/content";

/** Only site paths or https links are followed from a banner's CTA. */
export function bannerHref(link: string | null | undefined): { href: string; external: boolean } | null {
  if (!link) return null;
  if (link.startsWith("/") && !link.startsWith("//")) return { href: link, external: false };
  return /^https:\/\//i.test(link) ? { href: link, external: true } : null;
}

function BannerCard({ b, priority }: { b: Banner; priority: boolean }) {
  const src = mediaUrl(b.image_url);
  const target = bannerHref(b.cta_link);
  const inner = (
    <>
      {src && (
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 768px) 50vw, 85vw"
          className="object-cover"
          unoptimized
        />
      )}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-drs-green via-drs-green/85 to-drs-green/20"
      />
      <span className="relative flex h-full flex-col justify-end p-5 md:p-7">
        <span className="max-w-xs text-xl leading-snug font-semibold text-drs-cream md:text-2xl">
          {b.title}
        </span>
        {target && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-drs-cream">
            Shop now{" "}
            <ArrowRightIcon aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </span>
    </>
  );
  const box =
    "group relative block aspect-[16/7] min-h-44 w-full min-w-0 overflow-hidden rounded-2xl bg-drs-green shadow-sm transition-shadow hover:shadow-md";
  if (!target) return <div className={box}>{inner}</div>;
  return target.external ? (
    <a href={target.href} target="_blank" rel="noopener noreferrer" className={box}>
      {inner}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <Link href={target.href} className={box}>
      {inner}
    </Link>
  );
}

/** Active promo banners from the CMS (GET /content/banners) as a band on the home page; hidden when none. */
export async function PromoBanners() {
  const res = await getBanners();
  if (!res.ok || res.data.length === 0) return null;
  return (
    // minmax(0,1fr) tracks: a card's content must never widen the grid past the page (md+).
    <section aria-label="Offers">
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-[repeat(2,minmax(0,1fr))] md:overflow-visible md:px-0">
        {res.data.slice(0, 4).map((b, i) => (
          <li key={b.id} className="w-[85%] shrink-0 snap-start md:w-auto md:min-w-0">
            <BannerCard b={b} priority={i === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}
