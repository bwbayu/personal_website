import { registry } from "@/lib/admin/config";
import { DomainFormPage } from "@/components/admin/DomainFormPage";

// Static export needs the [domain] values up front. Singleton domains (about) edit via
// their list route, so they are excluded here.
export function generateStaticParams() {
  return registry.filter((domain) => !domain.singleton).map((domain) => ({ domain: domain.slug }));
}

export default function AdminEditPage({ params }: { params: { domain: string } }) {
  return <DomainFormPage slug={params.domain} mode="edit" />;
}
