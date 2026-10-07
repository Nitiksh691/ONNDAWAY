import { redirect } from "next/navigation";

// /store/[category] redirects to /menu?world=munchies
// No separate category browsing pages. All browsing is done in the unified menu.
export default function StoreCategoryPage() {
  redirect("/menu?world=munchies");
}
