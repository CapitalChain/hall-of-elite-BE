import { z } from "zod";

export const getTraderRewardsParamsSchema = z.object({
  id: z.string().uuid("Invalid trader ID format"),
});
