"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { UserProfile, CartItem, MenuItem, SelectedCustomization } from "./types";
import { buildLineDetails, normalizeCartLine } from "./orderLine";
import { STORAGE_KEYS } from "./constants";

// ── Type for the minimal session user object ─────────────────────────────────
interface SessionUser {
  uid: string;
}

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

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

  const customizationKey = (customizations?: SelectedCustomization[]) =>
    JSON.stringify((customizations || []).map(c => `${c.category}:${c.option}`).sort());

  const addToCart = useCallback((item: MenuItem, specialInstructions?: string, selectedCustomizations?: SelectedCustomization[], unitPrice?: number) => {
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
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => {
      // Fallback to item.id if cartItemId doesn't match but item.id does (for legacy)
      const updated = prev.filter((c) => c.cartItemId !== cartItemId && c.item.id !== cartItemId);
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
      const updated = prev.map((c) => (c.cartItemId === cartItemId || c.item.id === cartItemId) ? { ...c, quantity: qty } : c);
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
