import { CmsPageView, cmsMetadata, type CmsRoute } from "@/components/marketing/cms-page";

const ROUTE: CmsRoute = {
  slug: "contact",
  title: "Contact us",
  description: "How to reach the DRS Dairy team.",
  eyebrow: "Get in touch",
};

export const generateMetadata = () => cmsMetadata(ROUTE);

export default function ContactPage() {
  return <CmsPageView route={ROUTE} />;
}
