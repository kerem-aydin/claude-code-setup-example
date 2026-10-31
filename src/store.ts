// In-memory store. Swap for a database adapter with the same interface.
import type { Order } from "./orders.ts";

export class OrderStore {
  #orders = new Map<string, Order>();
  #seq = 0;

  create(data: Omit<Order, "id" | "status" | "createdAt">, now = new Date()): Order {
    this.#seq += 1;
    const id = `ord_${String(this.#seq).padStart(4, "0")}`;
    const order: Order = { ...data, id, status: "pending", createdAt: now.toISOString() };
    this.#orders.set(order.id, order);
    return order;
  }

  get(id: string): Order | undefined {
    return this.#orders.get(id);
  }

  list(): Order[] {
    return [...this.#orders.values()];
  }

  setStatus(id: string, status: Order["status"]): Order | undefined {
    const order = this.#orders.get(id);
    if (!order) return undefined;
    order.status = status;
    return order;
  }
}
