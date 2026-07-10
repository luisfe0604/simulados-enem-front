import { requireAdminPage } from "@/lib/page-guards";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  return <AdminDashboardClient />;
}
