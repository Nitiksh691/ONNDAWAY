export default function VendorLayout({ children }: { children: React.ReactNode }) {
  // Vendor portal has its own isolated UI — no app navbar, no bottom nav, no music player
  return <>{children}</>;
}
