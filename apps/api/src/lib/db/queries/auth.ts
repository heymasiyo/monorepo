import type { Database } from "@/lib/db/client";

import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { account, session, user } from "@/lib/db/schema/auth";

export async function checkEmailExists(db: Database, email: string) {
  const isExists = await db.$count(user, eq(user.email, email));

  return isExists;
}

export type CreateUserParams = {
  name: string;
  email: string;
};

export async function createUser(db: Database, params: CreateUserParams) {
  const [result] = await db
    .insert(user)
    .values({
      id: uuidv4(),
      name: params.name,
      email: params.email,
      emailVerified: true,
    })
    .returning();

  return result;
}

export type CreateEmailAccountParams = {
  userId: string;
  password: string;
};

export async function createEmailAccount(
  db: Database,
  params: CreateEmailAccountParams
) {
  const [result] = await db
    .insert(account)
    .values({
      id: uuidv4(),
      userId: params.userId,
      accountId: params.userId,
      providerId: "email",
      password: params.password,
    })
    .returning();

  return result;
}

export async function getUserByEmail(db: Database, email: string) {
  const [result] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
    })
    .from(user)
    .where(eq(user.email, email));

  return result;
}

export async function getEmailAccount(db: Database, userId: string) {
  const [result] = await db
    .select({
      id: account.id,
      userId: account.userId,
      accountId: account.accountId,
      providerId: account.providerId,
      password: account.password,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "email")));

  return result;
}

export type createSessionParams = {
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  activeWorkspaceId: string;
};

export async function createSession(db: Database, params: createSessionParams) {
  const [result] = await db
    .insert(session)
    .values({
      id: uuidv4(),
      userId: params.userId,
      token: params.token,
      expiresAt: params.expiresAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      activeWorkspaceId: params.activeWorkspaceId,
    })
    .returning();

  return result;
}

export async function getSessionByToken(db: Database, token: string) {
  const [result] = await db
    .select({
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      activeWorkspaceId: session.activeWorkspaceId,
    })
    .from(session)
    .where(eq(session.token, token));

  return result;
}

export async function deleteSessionByToken(db: Database, token: string) {
  const [result] = await db
    .delete(session)
    .where(eq(session.token, token))
    .returning();

  return result;
}

export type UpdatePasswordAccountParams = {
  userId: string;
  password: string;
};

export async function updatePasswordAccount(
  db: Database,
  params: UpdatePasswordAccountParams
) {
  const [result] = await db
    .update(account)
    .set({
      password: params.password,
    })
    .where(
      and(eq(account.userId, params.userId), eq(account.providerId, "email"))
    )
    .returning();

  return result;
}

export async function deleteSessionByUserId(db: Database, userId: string) {
  const [result] = await db
    .delete(session)
    .where(eq(session.userId, userId))
    .returning();

  return result;
}

export async function deleteSessionByWorkspaceId(
  db: Database,
  workspaceId: string
) {
  const [result] = await db
    .delete(session)
    .where(eq(session.activeWorkspaceId, workspaceId))
    .returning();

  return result;
}
