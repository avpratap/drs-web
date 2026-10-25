import { CmsPageView, cmsMetadata, type CmsRoute } from "@/components/marketing/cms-page";

const ROUTE: CmsRoute = {
  slug: "terms",
  title: "Terms of service",
  description: "The terms that apply when you shop with DRS Dairy.",
  eyebrow: "Legal",
};

export const generateMetadata = () => cmsMetadata(ROUTE);

export default function TermsPage() {
  return <CmsPageView route={ROUTE} />;
}
