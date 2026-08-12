"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { UserProfile, CartItem, MenuItem, SelectedCustomization } from "./types";
import { buildLineDetails, normalizeCartLine } from "./orderLine";
import { STORAGE_KEYS } from "./constants";

// ── Type for the minimal session user object ─────────────────────────────────
interface SessionUser {
  uid: string;
}

export const customizationKey = (customizations?: SelectedCustomization[]) =>
  JSON.stringify((customizations || []).map(c => `${c.category}:${c.option}`).sort());

// ── Context shape ─────────────────────────────────────────────────────────────
interface AppContextType {
  /** Logged-in session user (just the uid). Null if not authenticated. */
  user: SessionUser | null;
  /** Full user profile fetched from the database. Null until loaded. */
  profile: UserProfile | null;
  /** True while the initial session check is in flight. */
  loading: boolean;
  /** Current cart contents. */
  cart: CartItem[];
  addToCart: (item: MenuItem, specialInstructions?: string, selectedCustomizations?: SelectedCustomization[], unitPrice?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  /** Sum of (price × quantity) for all cart items, before fees/discounts. */
  cartTotal: number;
  /** Total number of individual items (sum of quantities) in the cart. */
  cartCount: number;
  refreshProfile: () => Promise<void>;
  checkSession: () => Promise<void>;
  /** Re-fetch profile bypassing the 30s cache (e.g. after checkout). */
  syncProfile: (uid: string) => Promise<void>;
  /** Whether the global sidebar is open on desktop. */
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  /** Wishlist item IDs */
  wishlist: string[];
  toggleWishlist: (itemId: string) => void;
  /** Global settings */
  settings: any | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [showLaunchingSoon, setShowLaunchingSoon] = useState(false);

  // ── Global Settings Fetch ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/settings/status")
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => setSettings({ mode: false }));
  }, []);

  // ── Wishlist — loaded from localStorage ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("otw_wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleWishlist = useCallback((itemId: string) => {
    setWishlist(prev => {
      const next = prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId];
      localStorage.setItem("otw_wishlist", JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Profile fetch ───────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (uid: string) => {
    // Check if we have a fresh profile in memory (30s TTL)
    const now = Date.now();
    if (
      typeof window !== "undefined" &&
      (window as any).__otw_profile_cache?.uid === uid &&
      now - (window as any).__otw_profile_cache.timestamp < 30000
    ) {
      setProfile((window as any).__otw_profile_cache.data);
      return;
    }

    try {
      const res = await fetch(`/api/users?userId=${uid}`);
      if (res.ok) {
        const data = await res.json() as UserProfile;
        if (typeof window !== "undefined") {
          (window as any).__otw_profile_cache = { uid, data, timestamp: Date.now() };
        }
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
      setProfile(null);
    }
  }, []);

  const syncProfile = useCallback(async (uid: string) => {
    if (typeof window !== "undefined") {
      delete (window as any).__otw_profile_cache;
    }
    setUser({ uid });
    await fetchProfile(uid);
  }, [fetchProfile]);

  // ── Session check — reads from localStorage (SSR-safe via useEffect) ────────
  const checkSession = useCallback(async () => {
    try {
      const localUserId = localStorage.getItem(STORAGE_KEYS.userId);
      if (localUserId) {
        setUser({ uid: localUserId });
        await fetchProfile(localUserId);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (e) {
      console.error("Session check failed", e);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // ── Cart — loaded from localStorage after mount (SSR-safe) ─────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.cart);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartItem[];
        setCart(parsed.map(normalizeCartLine));
      } catch {
        /* Corrupted localStorage — silently ignore and start fresh */
      }
    }
  }, []);

  // ── Cross-tab cart sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.cart && e.newValue) {
        try {
          setCart(JSON.parse(e.newValue).map(normalizeCartLine));
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const saveCart = useCallback((newCart: CartItem[]) => {
    // Migrate legacy carts to have cartItemId
    const migrated = newCart.map(c => ({
      ...c,
      cartItemId: c.cartItemId || `${c.item.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    }));
    setCart(migrated);
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(migrated));
  }, []);

  const addToCart = useCallback((item: MenuItem, specialInstructions?: string, selectedCustomizations?: SelectedCustomization[], unitPrice?: number) => {
    // Check Launching Soon Mode first!
    if (settings?.launchingSoonMode) {
      setShowLaunchingSoon(true);
      return;
    }

    const resolvedPrice = unitPrice ?? item.price;
    const customizations = selectedCustomizations ?? [];
    const lineDetails = buildLineDetails(customizations, specialInstructions);

    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.item.id === item.id &&
          (c.specialInstructions || "") === (specialInstructions || "") &&
          customizationKey(c.selectedCustomizations) === customizationKey(customizations)
      );

      // Check Limits
      const currentTotalQty = prev.reduce((sum, c) => sum + c.quantity, 0);
      const currentItemQty = prev.filter(c => c.item.id === item.id).reduce((sum, c) => sum + c.quantity, 0);

      if (currentTotalQty >= 5) {
        import("react-hot-toast").then(mod => mod.default.error("You can only order a maximum of 5 items. If you want to order more, please place your order and request a support call, or contact the support team."));
        return prev;
      }
      if (currentItemQty >= 3) {
        import("react-hot-toast").then(mod => mod.default.error(`You can only order a maximum of 3 portions of ${item.name}. If you want to order more, please contact the support team.`));
        return prev;
      }

      const updated = existing
        ? prev.map((c) => c.cartItemId === existing.cartItemId ? { ...c, quantity: c.quantity + 1 } : c)
        : [...prev, normalizeCartLine({
            cartItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            item,
            quantity: 1,
            specialInstructions: specialInstructions || undefined,
            selectedCustomizations: customizations,
            unitPrice: resolvedPrice,
            lineDetails,
          })];
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(updated));
      return updated;
    });
  }, [settings?.launchingSoonMode]);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => {
      const updated = prev.filter((c) => c.cartItemId !== cartItemId);
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart((prev) => {
      const targetItem = prev.find(c => c.cartItemId === cartItemId);
      if (!targetItem) return prev;
      
      const otherTotalQty = prev.filter(c => c.cartItemId !== targetItem.cartItemId).reduce((sum, c) => sum + c.quantity, 0);
      const otherSameItemQty = prev.filter(c => c.item.id === targetItem.item.id && c.cartItemId !== targetItem.cartItemId).reduce((sum, c) => sum + c.quantity, 0);

      if (otherTotalQty + qty > 5) {
        import("react-hot-toast").then(mod => mod.default.error("You can only order a maximum of 5 items. If you want to order more, please place your order and request a support call, or contact the support team."));
        return prev;
      }
      if (otherSameItemQty + qty > 3) {
        import("react-hot-toast").then(mod => mod.default.error(`You can only order a maximum of 3 portions of ${targetItem.item.name}. If you want to order more, please contact the support team.`));
        return prev;
      }

      const updated = prev.map((c) => c.cartItemId === cartItemId ? { ...c, quantity: qty } : c);
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(updated));
      return updated;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([]));
  }, []);

  // ── Derived totals (memoised) ───────────────────────────────────────────────
  const cartTotal = useMemo(
    () => cart.reduce((total, c) => total + (c.unitPrice ?? c.item.price) * c.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((count, c) => count + c.quantity, 0),
    [cart]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        refreshProfile: checkSession,
        checkSession,
        syncProfile,
        isSidebarOpen,
        setSidebarOpen,
        toggleSidebar: () => setSidebarOpen(prev => !prev),
        wishlist,
        toggleWishlist,
        settings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * useApp — access global app state inside any client component.
 * Must be called inside a component wrapped by <AppProvider>.
 */
export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
