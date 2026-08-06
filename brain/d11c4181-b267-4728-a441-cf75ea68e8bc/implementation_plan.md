# Codebase Optimization, Bug Fixes & Product Ordering Feature

This plan covers the previous optimization fixes plus the new requested feature to give you full control over the order of products in sliders.

## Proposed Changes

### 1. Custom Product Sort Order (New Feature)
**Problem:** Currently, products on the homepage and menu sliders appear in the order they were added to the database. You want the ability to explicitly set which position a product should be in.
**Solution:** 
- Add a `sortOrder` (number) field to the `MenuItem` database schema. 
- In the Admin Menu editor (`/admin/menu`), add a new "Display Position" input field where you can type a number (e.g., 1, 2, 3).
- Update the homepage and menu page to always sort products inside every slider based on this `sortOrder` (lowest number comes first).

#### [MODIFY] [models/MenuItem.ts](file:///c:/Users/nitik/Desktop/onndaway/src/models/MenuItem.ts)
- Add `sortOrder: { type: Number, default: 0 }`.
#### [MODIFY] [admin/menu/page.tsx](file:///c:/Users/nitik/Desktop/onndaway/src/app/admin/menu/page.tsx)
- Add a "Display Order / Position" input to the product edit dialog.
#### [MODIFY] [lib/types.ts](file:///c:/Users/nitik/Desktop/onndaway/src/lib/types.ts)
- Add `sortOrder?: number` to the `MenuItem` type.
#### [MODIFY] [app/page.tsx](file:///c:/Users/nitik/Desktop/onndaway/src/app/page.tsx) & [app/menu/page.tsx](file:///c:/Users/nitik/Desktop/onndaway/src/app/menu/page.tsx)
- Sort the `fullMenuItems` / `menu` arrays by `sortOrder` (ascending) before rendering the sliders so your custom order is respected everywhere.

### 2. Fix Server-Sent Events (SSE) Memory Leaks & Network Spam
**Problem:** Real-time updates create runaway background loops on disconnects, lagging the entire site.
**Solution:** Implement proper timeout cleanup logic in all SSE hooks.
- **Files Modified:** `track/[orderId]/page.tsx`, `cart/page.tsx`, `delivery/dashboard/page.tsx`, `admin/page.tsx`, `admin/orders/page.tsx`, `admin/layout.tsx`.

### 3. Fix React Performance Warnings & State Cascading
**Problem:** Unnecessary cascading re-renders on the main app load.
**Solution:** 
- **Files Modified:** `lib/context.tsx` (Refactor session & cart loading logic to avoid synchronous state updates).

### 4. Cleanup Unused Imports
**Problem:** Cluttered code and unused variables causing build warnings.
**Solution:** Remove unused `mongoose` imports across all model files in `src/models/`.

## Verification Plan
1. **Product Ordering Test:** Go to Admin > Menu, set a high-priority product's position to `1`, and verify it appears first on the homepage sliders.
2. **Lag Test:** Monitor the Network tab to ensure `/api/orders/stream` is not looping wildly, and verify UI responsiveness.
