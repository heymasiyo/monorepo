import type { Bindings } from "@/lib/types/bindings";
import type { Context } from "hono";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function clientDB(c: Context<{ Bindings: Bindings }>) {
  const sql = postgres(c.env.HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
  });
  const db = drizzle(sql);

  return db;
}
