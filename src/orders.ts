// Domain rules for orders. Pure functions only: no I/O in this file.

export type OrderItem = { sku: string; qty: number; unitPrice: number };
export type Order = {
  id: string;
  customerEmail: string;
  items: OrderItem[];
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
};

export const TAX_RATE = 0.2;

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export function validateOrderInput(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["body must be a JSON object"] };
  }
  const body = input as Record<string, unknown>;
  if (typeof body.customerEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail)) {
    errors.push("customerEmail must be a valid email");
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push("items must be a non-empty array");
  } else {
    body.items.forEach((item, i) => {
      const it = item as Record<string, unknown>;
      if (typeof it.sku !== "string" || it.sku.trim() === "") errors.push(`items[${i}].sku is required`);
      if (!Number.isInteger(it.qty) || (it.qty as number) < 1) errors.push(`items[${i}].qty must be an integer >= 1`);
      if (typeof it.unitPrice !== "number" || it.unitPrice < 0) errors.push(`items[${i}].unitPrice must be >= 0`);
    });
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

// Money is handled in cents to avoid floating point drift.
export function orderTotals(items: OrderItem[]) {
  const subtotalCents = items.reduce((sum, it) => sum + Math.round(it.unitPrice * 100) * it.qty, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

export function canCancel(order: Order): boolean {
  return order.status === "pending";
}
