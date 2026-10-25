import { CmsPageView, cmsMetadata, type CmsRoute } from "@/components/marketing/cms-page";

const ROUTE: CmsRoute = {
  slug: "privacy",
  title: "Privacy policy",
  description: "How DRS Dairy collects, uses and protects your personal data.",
  eyebrow: "Legal",
};

export const generateMetadata = () => cmsMetadata(ROUTE);

export default function PrivacyPage() {
  return <CmsPageView route={ROUTE} />;
}
