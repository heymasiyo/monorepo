import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logo: z.string().optional(),
  metadata: z.string().optional(),
});
