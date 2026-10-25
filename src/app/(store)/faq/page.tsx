import { CmsPageView, cmsMetadata, type CmsRoute } from "@/components/marketing/cms-page";

const ROUTE: CmsRoute = {
  slug: "faq",
  title: "Frequently asked questions",
  description: "Answers about deliveries, subscriptions, payments and our products.",
  eyebrow: "Help",
};

export const generateMetadata = () => cmsMetadata(ROUTE);

export default function FaqPage() {
  return <CmsPageView route={ROUTE} />;
}
