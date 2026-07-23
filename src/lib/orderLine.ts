import { CartItem, SelectedCustomization } from "./types";

/** Human-readable summary for kitchen/admin (always stored on order lines). */
export function buildLineDetails(
  customizations?: SelectedCustomization[],
  specialInstructions?: string
): string {
  const parts: string[] = [];

  if (customizations?.length) {
    parts.push(
      customizations
        .map(c => `${c.category}: ${c.option}${c.price > 0 ? ` (+₹${c.price})` : ""}`)
        .join(", ")
    );
  }

  const note = specialInstructions?.trim();
  if (note) parts.push(`Note: ${note}`);

  return parts.join(" | ");
}

/** Normalize a cart line before localStorage or order POST. */
export function normalizeCartLine(line: CartItem): CartItem {
  const customizations = line.selectedCustomizations ?? [];
  const unitPrice = line.unitPrice ?? line.item.price ?? 0;
  const specialInstructions = line.specialInstructions?.trim() || "";
  const lineDetails =
    line.lineDetails ||
    buildLineDetails(customizations, specialInstructions || undefined);

  return {
    cartItemId: line.cartItemId || `${line.item.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    item: {
      id: line.item.id,
      name: line.item.name,
      price: line.item.price,
      image: line.item.image ?? "",
      category: line.item.category ?? "",
      description: line.item.description ?? "",
      orderCount: line.item.orderCount ?? 0,
      available: line.item.available ?? true,
    },
    quantity: line.quantity || 1,
    unitPrice,
    selectedCustomizations: customizations,
    specialInstructions: specialInstructions || undefined,
    lineDetails,
  };
}

export function normalizeCartLines(lines: CartItem[]): CartItem[] {
  return lines.map(normalizeCartLine);
}
