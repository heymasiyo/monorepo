import { Hono } from "hono";

import authRouter from "@/routes/core/auth";

const coreRouter = new Hono();

coreRouter.route("/auth", authRouter);

export default coreRouter;
