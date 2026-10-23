// ⚠️  SERVER-ONLY — this file imports mongoose models.
// For client-safe geo utilities, import from "@/lib/geoUtils" instead.
import Store from "@/models/Store";
import type { Store as StoreType, ServiceabilityResult } from "@/lib/types";
import { calculateDistanceKm, isStoreOpen } from "@/lib/geoUtils";
export { calculateDistanceKm, isStoreOpen } from "@/lib/geoUtils";

interface CheckServiceabilityParams {
  latitude?: number | null;
  longitude?: number | null;
  areaName?: string | null;
  storeId?: string | null;
}

/**
 * Core Serviceability Engine
 * Evaluates whether an address, zone, or GPS coordinate can be served by any active store.
 */
export async function checkServiceability({
  latitude,
  longitude,
  areaName,
  storeId,
}: CheckServiceabilityParams): Promise<ServiceabilityResult> {
  // Query all active stores
  const stores = await Store.find({ isActive: true }).lean();

  const allAreasSet = new Set<string>();
  stores.forEach((s: any) => {
    (s.serviceAreas || []).forEach((a: string) => allAreasSet.add(a));
  });
  const allAreas = Array.from(allAreasSet);

  if (stores.length === 0) {
    return {
      isServiceable: false,
      store: null,
      message: "No active stores are currently available in the system.",
      availableStores: [],
      allAreas: [],
    };
  }

  // 1. If explicit storeId is requested (e.g., user specifically selected a store or revalidating order)
  if (storeId) {
    const targetStore = stores.find((s: any) => s._id.toString() === storeId);
    if (targetStore) {
      const open = isStoreOpen(targetStore.openingTime, targetStore.closingTime);
      if (!open) {
        return {
          isServiceable: false,
          store: mapStore(targetStore),
          message: `${targetStore.name} is currently closed. Operating hours: ${targetStore.openingTime} - ${targetStore.closingTime}.`,
          allAreas,
        };
      }
      if (!targetStore.isAcceptingOrders) {
        return {
          isServiceable: false,
          store: mapStore(targetStore),
          message: `${targetStore.name} is temporarily not accepting orders right now.`,
          allAreas,
        };
      }
      return {
        isServiceable: true,
        store: mapStore(targetStore),
        message: "Store is active and open.",
        allAreas,
      };
    }
  }

  // 2. Evaluate by Coordinates (GPS or map pin)
  if (latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)) {
    // Calculate distance to each active store
    const evaluated = stores.map((s: any) => {
      const storeLng = s.location.coordinates[0];
      const storeLat = s.location.coordinates[1];
      const dist = calculateDistanceKm(latitude, longitude, storeLat, storeLng);
      const open = isStoreOpen(s.openingTime, s.closingTime);
      const isWithinRadius = dist <= (s.serviceRadiusKm || 5);
      const isEligible = s.isAcceptingOrders && open && isWithinRadius;

      return {
        store: s,
        distanceKm: dist,
        open,
        isWithinRadius,
        isEligible,
      };
    });

    // Sort by: eligible first, then nearest distance
    evaluated.sort((a: any, b: any) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return a.distanceKm - b.distanceKm;
    });

    const best = evaluated[0];
    if (best && best.isEligible) {
      return {
        isServiceable: true,
        store: mapStore(best.store),
        distanceKm: best.distanceKm,
        message: `Serving from ${best.store.name} (${best.distanceKm} km away).`,
        availableStores: stores.map((s: any) => ({
          id: s._id.toString(),
          name: s.name,
          address: s.address,
          serviceAreas: s.serviceAreas || [],
        })),
        allAreas,
      };
    }

    // Customer is outside range or stores are closed
    const nearest = evaluated[0];
    if (nearest && !nearest.isWithinRadius) {
      return {
        isServiceable: false,
        store: null,
        distanceKm: nearest.distanceKm,
        message: `Sorry, ONN DA WAY does not deliver to this location yet. The closest store is ${nearest.distanceKm} km away (delivery radius is ${nearest.store.serviceRadiusKm} km).`,
        availableStores: stores.map((s: any) => ({
          id: s._id.toString(),
          name: s.name,
          address: s.address,
          serviceAreas: s.serviceAreas || [],
        })),
        allAreas,
      };
    }

    if (nearest && !nearest.open) {
      return {
        isServiceable: false,
        store: mapStore(nearest.store),
        distanceKm: nearest.distanceKm,
        message: `${nearest.store.name} is currently closed. Operating hours are ${nearest.store.openingTime} to ${nearest.store.closingTime}.`,
        allAreas,
      };
    }

    if (nearest && !nearest.store.isAcceptingOrders) {
      return {
        isServiceable: false,
        store: mapStore(nearest.store),
        distanceKm: nearest.distanceKm,
        message: `${nearest.store.name} is temporarily pausing new orders due to high volume. Please check back shortly!`,
        allAreas,
      };
    }
  }

  // 3. Evaluate by Named Delivery Area / Zone
  if (areaName && areaName.trim()) {
    const cleanArea = areaName.toLowerCase().trim();

    // Check stores whose serviceAreas include or match this zone
    const matchingStore = stores.find((s: any) => {
      return (s.serviceAreas || []).some((area: string) => {
        const a = area.toLowerCase();
        return a.includes(cleanArea) || cleanArea.includes(a);
      });
    });

    if (matchingStore) {
      const open = isStoreOpen(matchingStore.openingTime, matchingStore.closingTime);
      if (!open) {
        return {
          isServiceable: false,
          store: mapStore(matchingStore),
          message: `${matchingStore.name} serves ${areaName}, but is currently closed (${matchingStore.openingTime} - ${matchingStore.closingTime}).`,
          allAreas,
        };
      }
      if (!matchingStore.isAcceptingOrders) {
        return {
          isServiceable: false,
          store: mapStore(matchingStore),
          message: `${matchingStore.name} serves ${areaName}, but is temporarily not accepting orders right now.`,
          allAreas,
        };
      }

      return {
        isServiceable: true,
        store: mapStore(matchingStore),
        message: `Delivering to ${areaName} via ${matchingStore.name}.`,
        allAreas,
      };
    }
  }

  // 4. Default: Unserviceable
  return {
    isServiceable: false,
    store: null,
    message: "This location is not in our active delivery zone yet. Select from our supported locations below.",
    availableStores: stores.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      address: s.address,
      serviceAreas: s.serviceAreas || [],
    })),
    allAreas,
  };
}

function mapStore(doc: any): StoreType {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    code: doc.code,
    address: doc.address,
    city: doc.city,
    state: doc.state,
    country: doc.country,
    postalCode: doc.postalCode,
    location: doc.location,
    serviceRadiusKm: doc.serviceRadiusKm,
    serviceAreas: doc.serviceAreas || [],
    isActive: doc.isActive,
    isAcceptingOrders: doc.isAcceptingOrders,
    isBusy: !!doc.isBusy,
    openingTime: doc.openingTime,
    closingTime: doc.closingTime,
    minOrderValue: doc.minOrderValue || 0,
    deliveryFee: doc.deliveryFee != null ? doc.deliveryFee : 20,
    estimatedDeliveryMins: doc.estimatedDeliveryMins || 15,
    phone: doc.phone,
    managerName: doc.managerName || "",
    banner: doc.banner || "",
    notes: doc.notes || "",
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  };
}
