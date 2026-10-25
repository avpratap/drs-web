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
