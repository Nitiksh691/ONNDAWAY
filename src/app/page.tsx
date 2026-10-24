import HomePageClient from "./HomePageClient";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import Settings from "@/models/Settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  let initialMenu: any[] = [];
  let initialBanner = {
    bannerEnabled: true,
    bannerMode: "single",
    bannerSlides: [],
    bentoSlides: []
  };
  let initialHomeLayout = {
    heroSectionEnabled: true,
    minOrderValue: 69
  };

  try {
    await dbConnect();

    // Fetch initial data
    const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 }).lean();
    initialMenu = JSON.parse(JSON.stringify(items.map((i: any) => ({ ...i, _id: i._id.toString(), id: i._id.toString() }))));

    let settings = await Settings.findOne({}).lean();
    if (settings) {
      initialBanner = JSON.parse(JSON.stringify({
        bannerEnabled: settings.bannerEnabled ?? true,
        bannerMode: settings.bannerMode || "single",
        bannerSlides: (settings.bannerSlides || []).filter((s: any) => s.active && s.image),
        bentoSlides: settings.bentoSlides || []
      }));

      initialHomeLayout = JSON.parse(JSON.stringify({
        ...(settings.homeLayout || {}),
        heroSectionEnabled: settings.heroSectionEnabled ?? true,
        minOrderValue: settings.minOrderValue ?? 69,
      }));
    }
  } catch (error) {
    console.warn("MongoDB prefetch during build or page load skipped, client will fetch dynamically:", error);
  }

  return <HomePageClient initialMenu={initialMenu} initialBanner={initialBanner} initialHomeLayout={initialHomeLayout} />;
}
