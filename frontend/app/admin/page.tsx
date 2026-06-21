import { DashboardClient } from "@/components/admin/DashboardClient";

// Admin dashboard: a card per manageable content domain with a live item count and
// quick links. The auth guard and shell are applied by the admin layout, so this page
// only renders the content.
export default function AdminDashboardPage() {
  return <DashboardClient />;
}
