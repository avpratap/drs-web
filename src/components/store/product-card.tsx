import { RepeatIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { categoryMeta, productHref } from "@/modules/store/categories";
import type { StoreProduct } from "@/modules/store/catalog";

/** "500 ml", "1 L", "200 g", "1 kg", "12 pcs" from pack size + unit. */
export function packLabel(size: number, uom: string): string {
  const n = Number.isInteger(size) ? String(size) : String(Number(size.toFixed(2)));
  switch (uom.toLowerCase()) {
    case "ml":
      return size >= 1000 ? `${size / 1000} L` : `${n} ml`;
    case "litre":
    case "l":
      return `${n} L`;
    case "g":
      return size >= 1000 ? `${size / 1000} kg` : `${n} g`;
    case "kg":
      return `${n} kg`;
    case "piece":
      return `${n} pc${size === 1 ? "" : "s"}`;
    default:
      return `${n} ${uom}`;
  }
}

/** Storefront product tile: image (or an on-brand illustration), category, name, pack and rating. */
export function ProductCard({ product, className }: { product: StoreProduct; className?: string }) {
  const meta = categoryMeta(product.category ?? "");
  const Icon = meta.icon;
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-drs-ink/10 bg-drs-white shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "relative grid aspect-[4/3] place-items-center overflow-hidden",
          meta.milkLine ? "bg-drs-sky/15" : "bg-drs-cream",
        )}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 18rem, (min-width: 768px) 33vw, 70vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <span
            aria-hidden
            className="grid size-20 place-items-center rounded-full bg-drs-white/80 shadow-sm"
          >
            <Icon className="size-9 text-drs-green" strokeWidth={1.5} />
          </span>
        )}
        {product.is_subscribable && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-drs-white/95 px-2.5 py-1 text-[0.6875rem] font-semibold text-drs-green shadow-sm">
            <RepeatIcon aria-hidden className="size-3" strokeWidth={2.25} />
            Subscribe
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-drs-ink/70 uppercase">
          {meta.label}
        </p>
        <h3 className="text-[0.9375rem] leading-snug font-semibold text-drs-ink">
          <Link href={productHref(product.id)} className="after:absolute after:inset-0 hover:text-drs-green">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="whitespace-nowrap text-drs-ink/75">
            {packLabel(product.pack_size, product.uom)}
          </span>
          {product.rating_count > 0 && (
            <span
              className="inline-flex items-center gap-1 font-medium text-drs-ink"
              aria-label={`Rated ${product.avg_rating.toFixed(1)} out of 5 from ${product.rating_count} reviews`}
            >
              <StarIcon aria-hidden className="size-3.5 fill-drs-gold text-drs-gold" />
              {product.avg_rating.toFixed(1)}
              <span className="font-normal text-drs-ink/70">({product.rating_count})</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
