import { test } from "node:test";
import assert from "node:assert/strict";
import { canCancel, orderTotals, validateOrderInput, type Order } from "../src/orders.ts";

test("valid input passes", () => {
  const r = validateOrderInput({ customerEmail: "buyer@example.com", items: [{ sku: "MUG-01", qty: 2, unitPrice: 9.5 }] });
  assert.deepEqual(r, { ok: true });
});

test("invalid input lists every problem", () => {
  const r = validateOrderInput({ customerEmail: "nope", items: [{ sku: "", qty: 0, unitPrice: -1 }] });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.errors.length, 4);
});

test("totals are computed in cents with 20% tax", () => {
  assert.deepEqual(orderTotals([{ sku: "A", qty: 3, unitPrice: 0.1 }]), { subtotalCents: 30, taxCents: 6, totalCents: 36 });
});

test("only pending orders can be cancelled", () => {
  const base: Order = { id: "ord_0001", customerEmail: "a@b.co", items: [], status: "pending", createdAt: "" };
  assert.equal(canCancel(base), true);
  assert.equal(canCancel({ ...base, status: "paid" }), false);
});
