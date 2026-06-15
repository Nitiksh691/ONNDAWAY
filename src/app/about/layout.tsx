import { COMPANY_NAME } from "@/lib/company";

export const metadata = {
  title: `About Us | ${COMPANY_NAME}`,
  description: "Learn about ONN D A WAY — a bootstrapped food delivery startup serving fresh coffee and meals to campus communities.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
