
import HomePageClient from "./HomePageClient";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import Settings from "@/models/Settings";

export const dynamic = "force-dynamic";

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
    minGroceryOrderValue: 0,
  };

  try {
    await dbConnect();

    // Fetch initial data
    const items = await MenuItem.find({ available: true, approvalStatus: { $nin: ["pending", "rejected"] } })
      .sort({ category: 1, name: 1 })
      .lean();
    initialMenu = JSON.parse(JSON.stringify(items.map((i: any) => ({ ...i, _id: i._id.toString(), id: i._id.toString() }))));

    const settings: any = (await Settings.findOne({}).lean()) || {};

    initialBanner = JSON.parse(JSON.stringify({
      bannerEnabled: settings.bannerEnabled ?? true,
      bannerMode: settings.bannerMode || "single",
      bannerSlides: (settings.bannerSlides || []).filter((s: any) => s.active && s.image),
      bentoSlides: settings.bentoSlides || []
    }));

    initialHomeLayout = JSON.parse(JSON.stringify({
      ...(settings.homeLayout || {}),
      heroSectionEnabled: settings.heroSectionEnabled ?? true,
      minGroceryOrderValue: settings.minGroceryOrderValue ?? 0,
    }));
  } catch (err) {
    console.warn("[page] Failed to pre-fetch initial data:", err);
  }

  return <HomePageClient initialMenu={initialMenu} initialBanner={initialBanner} initialHomeLayout={initialHomeLayout} />;
}
