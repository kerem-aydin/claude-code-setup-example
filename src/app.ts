// Request handler, kept separate from the server so tests can start it on a random port.
import type { IncomingMessage, ServerResponse } from "node:http";
import { canCancel, orderTotals, validateOrderInput, type OrderItem } from "./orders.ts";
import { OrderStore } from "./store.ts";

const INVALID_JSON = Symbol("invalid-json");

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return INVALID_JSON;
  }
}

export function createApp(store = new OrderStore()) {
  return async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);

    if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { status: "ok" });

    if (parts[0] === "orders" && parts.length === 1) {
      if (req.method === "GET") return send(res, 200, { orders: store.list() });
      if (req.method === "POST") {
        const body = await readJson(req);
        if (body === INVALID_JSON) return send(res, 400, { errors: ["invalid JSON"] });
        const check = validateOrderInput(body);
        if (!check.ok) return send(res, 422, { errors: check.errors });
        const { customerEmail, items } = body as { customerEmail: string; items: OrderItem[] };
        const order = store.create({ customerEmail, items });
        return send(res, 201, { order, totals: orderTotals(order.items) });
      }
    }

    if (parts[0] === "orders" && parts.length === 2 && req.method === "GET") {
      const order = store.get(parts[1]);
      if (!order) return send(res, 404, { errors: ["order not found"] });
      return send(res, 200, { order, totals: orderTotals(order.items) });
    }

    if (parts[0] === "orders" && parts[2] === "cancel" && req.method === "POST") {
      const order = store.get(parts[1]);
      if (!order) return send(res, 404, { errors: ["order not found"] });
      if (!canCancel(order)) return send(res, 409, { errors: [`cannot cancel a ${order.status} order`] });
      return send(res, 200, { order: store.setStatus(order.id, "cancelled") });
    }

    return send(res, 404, { errors: ["route not found"] });
  };
}
