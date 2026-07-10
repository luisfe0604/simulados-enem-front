import { requireAdminPage } from "@/lib/page-guards";
import NewQuestionClient from "./NewQuestionClient";

export default async function NewQuestionPage() {
  await requireAdminPage();
  return <NewQuestionClient />;
}
