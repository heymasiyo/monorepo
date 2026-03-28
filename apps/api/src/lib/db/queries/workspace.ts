import type { Database } from "@/lib/db/client";

import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { member, workspace, workspaceRole } from "@/lib/db/schema/workspace";

export async function checkSlugExists(db: Database, slug: string) {
  const isExists = await db.$count(workspace, eq(workspace.slug, slug));

  return isExists;
}

export type CreateWorkspaceParams = {
  name: string;
  slug: string;
};

export async function createWorkspace(
  db: Database,
  params: CreateWorkspaceParams
) {
  const [result] = await db
    .insert(workspace)
    .values({
      id: uuidv4(),
      name: params.name,
      slug: params.slug,
    })
    .returning();

  return result;
}

export type CreateWorkspaceRoleParams = {
  workspaceId: string;
  role: string;
  superuser: boolean;
  permission: string;
};

export async function createWorkspaceRole(
  db: Database,
  params: CreateWorkspaceRoleParams
) {
  const [result] = await db
    .insert(workspaceRole)
    .values({
      id: uuidv4(),
      workspaceId: params.workspaceId,
      role: params.role,
      superuser: params.superuser,
      permission: params.permission,
    })
    .returning();

  return result;
}

export type CreateMemberParams = {
  userId: string;
  workspaceId: string;
  workspaceRoleId: string;
};

export async function createMember(db: Database, params: CreateMemberParams) {
  const [result] = await db
    .insert(member)
    .values({
      id: uuidv4(),
      userId: params.userId,
      workspaceId: params.workspaceId,
      workspaceRoleId: params.workspaceRoleId,
    })
    .returning();

  return result;
}

export async function getWorkspaceIdByUserId(db: Database, userId: string) {
  const [result] = await db
    .select({
      id: workspace.id,
    })
    .from(workspace)
    .innerJoin(member, eq(workspace.id, member.workspaceId))
    .where(eq(member.userId, userId));

  return result.id;
}
