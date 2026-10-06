import { redirect } from "next/navigation";

// /store now redirects to /menu?world=munchies
// No separate customer-facing store page. Everything is unified in the menu.
export default function StorePage() {
  redirect("/menu?world=munchies");
}
