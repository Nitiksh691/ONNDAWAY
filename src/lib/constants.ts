/**
 * src/lib/constants.ts
 *
 * Single source of truth for all magic strings and numbers used across
 * the app. Importing from here instead of scattering literals prevents
 * typos and makes global renames trivial.
 */

// ── localStorage Keys ───────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  /** The currently logged-in user's ID (phone number for customers, user_ prefix for staff) */
  userId: "otw_user_id",
  /** Cart contents — serialised CartItem[] */
  cart: "otw_cart",
  /** Set to "true" once the admin passcode has been validated */
  adminAuthorized: "otw_admin_authorized",
  /** Admin-controlled homepage announcement banner (JSON) */
  demoBanner: "otw_demo_banner",
  /** Demo mode flag */
  demo: "otw_demo",
  /** Demo orders for mock mode */
  demoOrders: "otw_demo_orders",
  /** Active in-progress order ID — shown in floating track widget until delivered */
  activeOrderId: "otw_active_order_id",
  /** Cached user profile for demo mode */
  demoProfile: "otw_demo_profile",
} as const;

// ── Polling Intervals (milliseconds) ────────────────────────────────────────
export const POLL_INTERVALS = {
  /** How often the admin Live Orders page auto-refreshes */
  liveOrders: 3_000,
  /** How often the admin Dashboard KPIs auto-refresh */
  dashboard: 5_000,
  /** How often the post-checkout page polls for order confirmation */
  orderConfirmation: 3_000,
  /** How often the alarm repeats if there are unconfirmed orders */
  alarm: 8_000,
} as const;

// ── Validation ───────────────────────────────────────────────────────────────
/**
 * Regex for Indian mobile numbers:
 * - Must start with 6, 7, 8, or 9
 * - Exactly 10 digits
 */
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

// ── Business Rules ────────────────────────────────────────────────────────────
/** Default delivery fee in INR shown before settings are loaded from the API */
export const DEFAULT_DELIVERY_FEE = 20;

/** Maximum quantity of a single item allowed in the cart */
export const MAX_CART_QUANTITY = 10;

/** Maximum total item count (sum of quantities) allowed in one order */
export const MAX_CART_TOTAL_ITEMS = 20;

/** Maximum portions of the same menu item per order */
export const MAX_ITEM_QUANTITY = 5;

/** Number of skeleton cards to show while menu is loading */
export const SKELETON_CARD_COUNT = 8;
