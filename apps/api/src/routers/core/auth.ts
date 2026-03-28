import type { Bindings } from "@/lib/types/bindings";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";

import { connectDB } from "@/lib/db/client";
import {
  checkEmailExists,
  createEmailAccount,
  createSession,
  createUser,
  getEmailAccount,
  getUserByEmail,
} from "@/lib/db/queries/auth";
import {
  checkSlugExists,
  createMember,
  createWorkspace,
  createWorkspaceRole,
  getWorkspaceIdByUserId,
} from "@/lib/db/queries/workspace";
import { withBasicAuth } from "@/lib/middleware/basic-auth";
import zValidator from "@/lib/middleware/zod-validator";
import { signInEmailSchema, signUpEmailSchema } from "@/lib/schemas/auth";
import {
  getRequestInfo,
  hashPassword,
  isEmpty,
  slugify,
  verifyPassword,
} from "@/lib/utils";

const authRouter = new Hono<{ Bindings: Bindings }>();

authRouter.post(
  "/sign-up/email",
  withBasicAuth(),
  zValidator("json", signUpEmailSchema),
  async (c) => {
    const db = connectDB(c);
    const body = c.req.valid("json");

    const emailExists = await checkEmailExists(db, body.email);
    if (emailExists > 0) {
      throw new HTTPException(400, {
        message: "Email already exists",
      });
    }

    const userData = await createUser(db, {
      name: body.name,
      email: body.email,
    });

    await createEmailAccount(db, {
      userId: userData.id,
      password: hashPassword(body.password),
    });

    let workspaceSlug = slugify(body.name);

    const workspaceExists = await checkSlugExists(db, workspaceSlug);
    if (workspaceExists > 0) {
      workspaceSlug = `${slugify(body.name)}-${nanoid(10)}`;
    }

    const workspaceData = await createWorkspace(db, {
      name: body.name,
      slug: workspaceSlug,
    });

    const workspaceRoleData = await createWorkspaceRole(db, {
      workspaceId: workspaceData.id,
      role: "Administrator",
      superuser: true,
      permission: JSON.stringify([]),
    });

    await createMember(db, {
      userId: userData.id,
      workspaceId: workspaceData.id,
      workspaceRoleId: workspaceRoleData.id,
    });

    return c.json(
      {
        message: "Sign up successful",
      },
      200
    );
  }
);

authRouter.post(
  "/sign-in/email",
  withBasicAuth(),
  zValidator("json", signInEmailSchema),
  async (c) => {
    const db = connectDB(c);
    const body = c.req.valid("json");

    const userData = await getUserByEmail(db, body.email);
    if (isEmpty(userData)) {
      throw new HTTPException(400, {
        message: "Invalid email or password",
      });
    }

    const emailAccountData = await getEmailAccount(db, userData.id);
    if (!verifyPassword(body.password, emailAccountData.password as string)) {
      throw new HTTPException(400, {
        message: "Invalid email or password",
      });
    }

    const timestampToken = Math.floor(Date.now() / 1000);
    const expiresAt = timestampToken + 7 * 24 * 60 * 60;
    const expiresAtStr = new Date(expiresAt * 1000).toISOString();

    const payloadToken = {
      exp: expiresAt,
      nbf: timestampToken,
      iat: timestampToken,
      iss: userData.id,
    };
    const token = await sign(payloadToken, c.env.JWT_SECRET);

    const workspaceId = await getWorkspaceIdByUserId(db, userData.id);
    const { ip, userAgent } = getRequestInfo(c);

    await createSession(db, {
      userId: userData.id,
      token: token,
      expiresAt: expiresAtStr,
      ipAddress: ip,
      userAgent,
      activeWorkspaceId: workspaceId,
    });

    return c.json(
      {
        message: "Sign in successful",
        data: {
          token,
        },
      },
      200
    );
  }
);

export default authRouter;
