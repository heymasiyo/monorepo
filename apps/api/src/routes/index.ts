import { Hono } from "hono";

import coreRouter from "@/routes/core";

const routes = new Hono();

routes.route("/core/v1", coreRouter);

export default routes;
