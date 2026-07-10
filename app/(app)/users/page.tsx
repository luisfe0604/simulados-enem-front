import { requireAdminPage } from "@/lib/page-guards";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  await requireAdminPage();
  return <UsersClient />;
}
