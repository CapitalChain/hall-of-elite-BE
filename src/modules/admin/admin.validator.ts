import { z } from "zod";

export const getTierConfigByIdParamsSchema = z.object({
  id: z.string().min(1, "Tier ID is required"),
});
