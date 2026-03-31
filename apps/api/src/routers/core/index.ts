import { Hono } from "hono";

import authRouter from "@/routers/core/auth";
import workspaceRouter from "@/routers/core/workspace";

const coreRouter = new Hono();

coreRouter.route("/auth", authRouter);
coreRouter.route("/workspace", workspaceRouter);

export default coreRouter;
