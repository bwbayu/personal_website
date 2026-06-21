import { registry } from "@/lib/admin/config";
import { DomainListClient } from "@/components/admin/DomainListClient";

// Thin server component: enumerate the dynamic [domain] segment for static export and
// render the client list view. The auth guard + shell come from the admin layout.
export function generateStaticParams() {
  return registry.map((domain) => ({ domain: domain.slug }));
}

export default function AdminDomainPage({ params }: { params: { domain: string } }) {
  return <DomainListClient slug={params.domain} />;
}
