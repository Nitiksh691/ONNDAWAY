"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { UserProfile, CartItem, MenuItem } from "./types";
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
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
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
    try {
      const res = await fetch(`/api/users?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data as UserProfile);
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
        setCart(JSON.parse(saved) as CartItem[]);
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
          setCart(JSON.parse(e.newValue) as CartItem[]);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(newCart));
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      const updated = existing
        ? prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
        : [...prev, { item, quantity: 1 }];
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const updated = prev.filter((c) => c.item.id !== itemId);
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) => {
      const updated = prev.map((c) => c.item.id === itemId ? { ...c, quantity: qty } : c);
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
    () => cart.reduce((total, c) => total + c.item.price * c.quantity, 0),
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
