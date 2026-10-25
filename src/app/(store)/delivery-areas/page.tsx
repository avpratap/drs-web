import { CmsPageView, cmsMetadata, type CmsRoute } from "@/components/marketing/cms-page";

const ROUTE: CmsRoute = {
  slug: "delivery-areas",
  title: "Delivery areas",
  description: "Where we deliver every morning, and how to check your pincode.",
  eyebrow: "Delivery",
};

export const generateMetadata = () => cmsMetadata(ROUTE);

export default function DeliveryAreasPage() {
  return <CmsPageView route={ROUTE} />;
}
