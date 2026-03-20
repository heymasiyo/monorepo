import type { Bindings } from "@/lib/types/bindings";

import { Hono } from "hono";

const authRouter = new Hono<{ Bindings: Bindings }>();

export default authRouter;
