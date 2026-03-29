import type { Bindings } from "@/lib/types/bindings";
import type { Context } from "hono";

import { bearerAuth } from "hono/bearer-auth";
import { verify } from "hono/jwt";

import { connectDB } from "@/lib/db/client";
import { getSessionByToken } from "@/lib/db/queries/auth";
import { isEmpty } from "@/lib/utils";

export function withBearerAuth() {
  return bearerAuth({
    verifyToken: async (token, c: Context<{ Bindings: Bindings }>) => {
      try {
        const decoded = await verify(token, c.env.JWT_SECRET, "HS256");

        const db = connectDB(c);

        const sessionData = await getSessionByToken(db, token);
        if (isEmpty(sessionData)) {
          return false;
        }

        const payload = {
          ...decoded,
          token,
        };
        c.set("jwtPayload", payload);

        return true;
      } catch (error) {
        return false;
      }
    },
  });
}
