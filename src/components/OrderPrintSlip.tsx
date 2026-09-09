"use client";
import { Order } from "@/lib/types";

export type GridPreset = "1x1" | "2x3" | "3x3" | "4x2";

export interface BatchPrintOptions {
  orders: Order[];
  gridPreset?: GridPreset;
  startSlotIndex?: number; // 0-based index of starting position on cut sheet
}

/**
 * Print a single 60/40 partition receipt slip for thermal roll or A4 print.
 */
export function printOrder(order: Order) {
  const w = window.open("", "_blank", "width=440,height=720");
  if (!w) { alert("Pop-up blocked — please allow pop-ups for this site."); return; }

  const itemRows = order.items.map(line => {
    const unit = line.unitPrice ?? line.item?.price ?? 0;
    const total = unit * line.quantity;
    const customText = line.selectedCustomizations?.filter(c => c.category !== "Size")
      .map(c => `${c.option}${c.price > 0 ? ` +${c.price}` : ""}`)
      .join(", ") || "";
    const sizeLabel = line.selectedCustomizations?.find(c => c.category === "Size")?.option || "";

    return `
      <tr class="item-row">
        <td class="item-name">
          <span class="item-qty">${line.quantity}×</span>
          ${line.item?.name || "Item"}
          ${sizeLabel ? `<span class="size-tag">${sizeLabel}</span>` : ""}
          ${customText ? `<div class="item-custom">${customText}</div>` : ""}
          ${line.specialInstructions ? `<div class="item-note">Note: ${line.specialInstructions}</div>` : ""}
        </td>
        <td class="item-price">₹${total}</td>
      </tr>`;
  }).join("");

  const subtotal = order.items.reduce((s, l) => {
    const u = l.unitPrice ?? l.item?.price ?? 0;
    return s + u * l.quantity;
  }, 0);

  const now = new Date(order.createdAt || Date.now());
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const shortId = order.id?.slice(-6).toUpperCase() || "------";

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>ONN DA WAY — Order #${shortId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #fff;
      width: 100%;
      height: 100vh;
      display: grid;
      grid-template-columns: 60% 40%;
    }
    .slip {
      padding: 18px 16px 24px;
      border-right: 1.5px dashed #999;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .brand { text-align: center; margin-bottom: 10px; }
    .brand h1 { font-size: 18px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .brand p { font-size: 9px; color: #555; letter-spacing: 1px; margin-top: 2px; }
    .divider { border: none; border-top: 1px dashed #999; margin: 8px 0; }
    .meta { font-size: 9.5px; line-height: 1.6; }
    .order-id {
      text-align: center; font-size: 22px; font-weight: 900; letter-spacing: 3px;
      margin: 8px 0; background: #000; color: #fff; padding: 4px 0; border-radius: 4px;
    }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    th { font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding: 3px 0; text-align: left; }
    th:last-child { text-align: right; }
    .item-row td { vertical-align: top; padding: 4px 0; border-bottom: 1px dotted #ddd; font-size: 10px; }
    .item-price { text-align: right; white-space: nowrap; font-weight: 700; }
    .item-qty { font-weight: 900; color: #000; margin-right: 2px; }
    .size-tag { display: inline-block; font-size: 8px; background: #eee; padding: 0 4px; border-radius: 3px; margin-left: 4px; font-weight: 600; }
    .item-custom { font-size: 8.5px; color: #444; margin-top: 2px; }
    .item-note { font-size: 8px; color: #666; font-style: italic; margin-top: 1px; }
    .totals { margin-top: 6px; font-size: 10px; }
    .totals tr td { padding: 2px 0; }
    .totals tr td:last-child { text-align: right; }
    .total-row td { font-size: 13px; font-weight: 900; border-top: 1.5px solid #333; padding-top: 5px !important; }
    .payment-badge {
      margin-top: 10px; text-align: center; font-size: 10px; font-weight: 700;
      padding: 4px; border: 1.5px solid #333; border-radius: 4px; letter-spacing: 0.5px;
    }
    .footer-note { margin-top: auto; text-align: center; font-size: 8px; color: #666; line-height: 1.6; padding-top: 12px; }
    .stub { padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .stub-id { font-size: 28px; font-weight: 900; letter-spacing: 4px; writing-mode: vertical-rl; transform: rotate(180deg); border: 2px solid #111; padding: 12px 6px; border-radius: 6px; }
    .stub-meta { font-size: 9px; text-align: center; line-height: 1.8; color: #555; }
    .stub-location { font-size: 11px; font-weight: 700; text-align: center; border: 1px dashed #aaa; padding: 6px 10px; border-radius: 4px; width: 100%; }
    .stub-total { font-size: 16px; font-weight: 900; text-align: center; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="slip">
    <div class="brand"><h1>ONN DA WAY</h1><p>CAMPUS FOOD DELIVERY</p></div>
    <hr class="divider"/>
    <div class="meta">
      <strong>#${shortId}</strong><br/>
      ${dateStr} &nbsp;·&nbsp; ${timeStr}<br/>
      <strong>Customer:</strong> ${order.userName || "—"}<br/>
      <strong>Phone:</strong> ${order.userPhone || "—"}<br/>
      <strong>Location:</strong> ${order.location || "—"}
      ${order.locationNotes ? `<br/><strong>Notes:</strong> ${order.locationNotes}` : ""}
    </div>
    <div class="order-id">#${shortId}</div>
    <table>
      <thead><tr><th>Item</th><th>Amt</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table class="totals">
      <tbody>
        <tr><td>Subtotal</td><td>₹${subtotal}</td></tr>
        ${order.discount && order.discount > 0 ? `<tr><td>Discount (${order.couponCode || ""})</td><td>−₹${order.discount}</td></tr>` : ""}
        ${order.total !== subtotal ? `<tr><td>Delivery Fee</td><td>₹${order.total - subtotal + (order.discount || 0)}</td></tr>` : ""}
        <tr class="total-row"><td>TOTAL</td><td>₹${order.total}</td></tr>
      </tbody>
    </table>
    <div class="payment-badge">${order.paymentMethod === "COD" ? "💵 CASH ON DELIVERY" : "✅ PAID ONLINE · " + (order.paymentStatus || "")}</div>
    <div class="footer-note">Thank you for ordering with ONN DA WAY!<br/>Support: +91-8130939274</div>
  </div>
  <div class="stub">
    <div class="stub-id">#${shortId}</div>
    <div class="stub-meta">${dateStr}<br/>${timeStr}<br/>${order.userName || ""}</div>
    <div class="stub-location">📍 ${order.location || "—"}</div>
    <div class="stub-total">₹${order.total}</div>
    <div class="stub-meta">${order.paymentMethod === "COD" ? "COD" : "PAID"}</div>
  </div>
</body>
</html>`);

  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}

/**
 * Print batch orders in a customizable multi-bill grid layout:
 * - 2x3 (6 per page)
 * - 3x3 (9 per page)
 * - 4x2 (8 per page)
 * - 1x1 (1 per page)
 * Supports `startSlotIndex` to skip already cut-out sections on re-used paper sheets!
 */
export function printBatchOrders({ orders, gridPreset = "2x3", startSlotIndex = 0 }: BatchPrintOptions) {
  if (!orders || orders.length === 0) {
    alert("No orders selected to print.");
    return;
  }

  const w = window.open("", "_blank", "width=850,height=1100");
  if (!w) { alert("Pop-up blocked — please allow pop-ups for this site."); return; }

  let cols = 2, rows = 3;
  if (gridPreset === "3x3") { cols = 3; rows = 3; }
  else if (gridPreset === "4x2") { cols = 4; rows = 2; }
  else if (gridPreset === "1x1") { cols = 1; rows = 1; }

  const pageSize = cols * rows;

  const slots: (Order | null)[] = [];
  for (let i = 0; i < startSlotIndex; i++) {
    slots.push(null);
  }
  orders.forEach(order => slots.push(order));

  const pages: (Order | null)[][] = [];
  for (let i = 0; i < slots.length; i += pageSize) {
    pages.push(slots.slice(i, i + pageSize));
  }

  const renderCardHTML = (order: Order | null) => {
    if (!order) {
      return `<div class="bill-card empty-slot"><div class="empty-label">CUT / BLANK SLOT</div></div>`;
    }

    const shortId = order.id?.slice(-6).toUpperCase() || "------";
    const now = new Date(order.createdAt || Date.now());
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const itemRowsHTML = order.items.map(line => {
      const unit = line.unitPrice ?? line.item?.price ?? 0;
      const sizeLabel = line.selectedCustomizations?.find(c => c.category === "Size")?.option || "";
      return `
        <tr>
          <td class="item-cell">
            <span class="qty">${line.quantity}x</span>
            ${line.item?.name || "Item"}
            ${sizeLabel ? `<span class="size">${sizeLabel}</span>` : ""}
          </td>
          <td class="price-cell">₹${unit * line.quantity}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="bill-card">
        <div class="card-header">
          <span class="card-title">ONN DA WAY</span>
          <span class="card-id">#${shortId}</span>
        </div>
        <div class="card-meta">
          <div><strong>${order.userName || "Customer"}</strong> · ${order.userPhone || ""}</div>
          <div class="loc-tag">📍 ${order.location || "Location"}</div>
          <div style="font-size: 7.5pt; color: #555;">${timeStr} · ${order.paymentMethod === "COD" ? "COD" : "PAID"}</div>
        </div>
        <table class="card-table">
          <tbody>
            ${itemRowsHTML}
          </tbody>
        </table>
        <div class="card-footer">
          <span>TOTAL (${order.items.reduce((s,i) => s + i.quantity, 0)} items)</span>
          <span class="total-amt">₹${order.total}</span>
        </div>
      </div>
    `;
  };

  const pagesHTML = pages.map((pageSlots, pIdx) => {
    const gridCards = pageSlots.map(slot => renderCardHTML(slot)).join("");
    return `
      <div class="print-page ${pIdx < pages.length - 1 ? 'page-break' : ''}">
        ${gridCards}
      </div>
    `;
  }).join("");

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>ONN DA WAY — Batch Bills (${gridPreset})</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: A4 portrait;
      margin: 6mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #fff;
      color: #000;
    }
    .print-page {
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      grid-template-rows: repeat(${rows}, 1fr);
      gap: 5mm;
      width: 100%;
      height: 280mm;
      page-break-after: always;
      box-sizing: border-box;
    }
    .page-break { page-break-after: always; }
    .bill-card {
      border: 1.5px dashed #444;
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #fff;
      overflow: hidden;
    }
    .empty-slot {
      border: 1px dashed #ccc;
      background: #f8fafc;
      align-items: center;
      justify-content: center;
    }
    .empty-label {
      font-size: 8pt;
      color: #94a3b8;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 3px;
      margin-bottom: 3px;
    }
    .card-title { font-size: 9pt; font-weight: 900; letter-spacing: 0.5px; }
    .card-id { font-size: 10pt; font-weight: 900; background: #0f172a; color: #fff; padding: 1px 5px; border-radius: 3px; }
    .card-meta { font-size: 7.5pt; line-height: 1.35; margin-bottom: 4px; }
    .loc-tag { font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    .card-table td { font-size: 7.5pt; padding: 1.5px 0; border-bottom: 1px dotted #e2e8f0; vertical-align: top; }
    .qty { font-weight: 800; margin-right: 2px; }
    .size { font-size: 6.5pt; background: #e2e8f0; padding: 0 3px; border-radius: 2px; font-weight: 700; }
    .price-cell { text-align: right; font-weight: 700; white-space: nowrap; }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #000;
      padding-top: 3px;
      font-size: 8pt;
      font-weight: 800;
    }
    .total-amt { font-size: 10pt; font-weight: 900; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${pagesHTML}
</body>
</html>`);

  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}

export default function OrderPrintSlip() {
  return null;
}
