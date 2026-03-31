import type { Bindings } from "@/lib/types/bindings";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { connectDB } from "@/lib/db/client";
import { deleteSessionByWorkspaceId } from "@/lib/db/queries/auth";
import {
  checkSlugExists,
  checkSlugExistsExceptId,
  createMember,
  createWorkspace,
  createWorkspaceRole,
  deleteWorkspaceById,
  getWorkspacesByUserId,
  updateWorkspace,
} from "@/lib/db/queries/workspace";
import { withBearerAuth } from "@/lib/middleware/bearer-auth";
import { zValidator } from "@/lib/middleware/zod-validator";
import { workspaceSchema } from "@/lib/schemas/workspace";
import { JwtPayload } from "@/lib/types/common";

const workspaceRouter = new Hono<{ Bindings: Bindings }>();

workspaceRouter.use("*", withBearerAuth());

workspaceRouter.post(
  "/create",
  zValidator("json", workspaceSchema),
  async (c) => {
    const db = connectDB(c);
    const session = c.get("jwtPayload") as JwtPayload;
    const body = c.req.valid("json");

    const slugExists = await checkSlugExists(db, body.slug);
    if (slugExists > 0) {
      throw new HTTPException(400, {
        message: "Slug already exists",
      });
    }

    const workspaceData = await createWorkspace(db, {
      name: body.name,
      slug: body.slug,
      logo: body.logo,
      metadata: body.metadata,
    });

    const workspaceRoleData = await createWorkspaceRole(db, {
      workspaceId: workspaceData.id,
      role: "Administrator",
      superuser: true,
      permission: JSON.stringify([]),
    });

    await createMember(db, {
      userId: session.sub,
      workspaceId: workspaceData.id,
      workspaceRoleId: workspaceRoleData.id,
    });

    return c.json(
      {
        message: "Create workspace successful",
      },
      200
    );
  }
);

workspaceRouter.get("/list", async (c) => {
  const db = connectDB(c);
  const session = c.get("jwtPayload") as JwtPayload;

  const workspacesData = await getWorkspacesByUserId(db, session.sub);

  return c.json(
    {
      message: "Workspace retrieved",
      data: workspacesData,
    },
    200
  );
});

workspaceRouter.post(
  "/update",
  zValidator("json", workspaceSchema),
  async (c) => {
    const db = connectDB(c);
    const session = c.get("jwtPayload") as JwtPayload;
    const body = c.req.valid("json");

    const slugExistsExceptId = await checkSlugExistsExceptId(db, {
      slug: body.slug,
      id: session.iss,
    });
    if (slugExistsExceptId > 0) {
      throw new HTTPException(400, {
        message: "Slug already exists",
      });
    }

    await updateWorkspace(db, {
      id: session.iss,
      name: body.name,
      slug: body.slug,
      logo: body.logo,
      metadata: body.metadata,
    });

    return c.json(
      {
        message: "Update workspace successful",
      },
      200
    );
  }
);

workspaceRouter.post("/delete", async (c) => {
  const db = connectDB(c);
  const session = c.get("jwtPayload") as JwtPayload;

  await deleteWorkspaceById(db, session.iss);

  await deleteSessionByWorkspaceId(db, session.iss);

  return c.json(
    {
      message: "Delete workspace successful",
    },
    200
  );
});

export default workspaceRouter;
