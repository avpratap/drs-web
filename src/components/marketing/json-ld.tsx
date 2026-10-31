import { mediaUrl } from "@/lib/media";
import { siteUrl } from "@/lib/site";

/** Structured data for search engines. `<` is escaped so content can't close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export { siteUrl };

export function organizationLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DRS Dairy",
    url,
    logo: `${url}/favicon.ico`,
    description: "Farm-fresh milk, curd, paneer and ghee, delivered before 7 am.",
    areaServed: "IN",
  };
}

/**
 * Product rich result: the product, its buyable packs as Offers (an AggregateOffer when there
 * are several), and its rating when it has any. Packs without a retail price are left out;
 * with none priced there's no offer at all (better than a wrong price).
 */
export function productLd(p: {
  name: string;
  sku: string;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  avg_rating: number;
  rating_count: number;
  path: string;
  packs: { label: string; price: number | null }[];
}) {
  const url = `${siteUrl()}${p.path}`;
  const offers = p.packs
    .filter((o): o is { label: string; price: number } => o.price != null)
    .map((o) => ({
      "@type": "Offer",
      name: o.label,
      price: o.price.toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url,
    }));
  const prices = offers.map((o) => Number(o.price));
  const image = mediaUrl(p.image_url);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    url,
    ...(p.description ? { description: p.description } : {}),
    ...(p.category ? { category: p.category } : {}),
    ...(image ? { image: [image] } : {}),
    brand: { "@type": "Brand", name: "DRS Dairy" },
    ...(offers.length === 1
      ? { offers: offers[0] }
      : offers.length > 1
        ? {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: Math.min(...prices).toFixed(2),
              highPrice: Math.max(...prices).toFixed(2),
              offerCount: offers.length,
              offers,
            },
          }
        : {}),
    ...(p.rating_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.avg_rating.toFixed(1),
            reviewCount: p.rating_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}
