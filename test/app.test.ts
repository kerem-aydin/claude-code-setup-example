import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";

let server: Server;
let base = "";

before(async () => {
  server = createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

async function createOrder(body: unknown) {
  return fetch(`${base}/orders`, { method: "POST", body: JSON.stringify(body) });
}

test("GET /health", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("POST /orders creates an order and returns totals", async () => {
  const res = await createOrder({ customerEmail: "buyer@example.com", items: [{ sku: "MUG-01", qty: 2, unitPrice: 12 }] });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.order.id, /^ord_\d{4}$/);
  assert.equal(body.totals.totalCents, 2880);
});

test("POST /orders rejects bad input with 422", async () => {
  const res = await createOrder({ items: [] });
  assert.equal(res.status, 422);
});

test("cancelling twice returns 409", async () => {
  const created = await (await createOrder({ customerEmail: "c@example.com", items: [{ sku: "TEE-02", qty: 1, unitPrice: 20 }] })).json();
  const id = created.order.id;
  assert.equal((await fetch(`${base}/orders/${id}/cancel`, { method: "POST" })).status, 200);
  assert.equal((await fetch(`${base}/orders/${id}/cancel`, { method: "POST" })).status, 409);
});
