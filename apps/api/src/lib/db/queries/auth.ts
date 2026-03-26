import type { Database } from "@/lib/db/client";

import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { account, user } from "@/lib/db/schema/auth";

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
