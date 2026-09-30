import HomePageClient from "./HomePageClient";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import Settings from "@/models/Settings";

export const revalidate = 60; // Cache for 60 seconds

export default async function Page() {
  await dbConnect();
  
  // Fetch initial data
  const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 }).lean();
  const initialMenu = JSON.parse(JSON.stringify(items.map((i: any) => ({ ...i, _id: i._id.toString(), id: i._id.toString() }))));

  let settings = await Settings.findOne({}).lean();
  if (!settings) settings = {};

  const initialBanner = JSON.parse(JSON.stringify({
    bannerEnabled: settings.bannerEnabled ?? true,
    bannerMode: settings.bannerMode || "single",
    bannerSlides: (settings.bannerSlides || []).filter((s: any) => s.active && s.image),
    bentoSlides: settings.bentoSlides || []
  }));

  return <HomePageClient initialMenu={initialMenu} initialBanner={initialBanner} />;
}
