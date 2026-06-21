import { registry } from "@/lib/admin/config";
import { DomainFormPage } from "@/components/admin/DomainFormPage";

// Static export needs the [domain] values up front. Singleton domains (about) have no
// create page, so they are excluded.
export function generateStaticParams() {
  return registry.filter((domain) => !domain.singleton).map((domain) => ({ domain: domain.slug }));
}

export default function AdminNewPage({ params }: { params: { domain: string } }) {
  return <DomainFormPage slug={params.domain} mode="new" />;
}
