import { z } from "zod";

export const getTraderParamsSchema = z.object({
  id: z.string().min(1, "Trader ID is required"),
});

export const getTradersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  tier: z.string().optional(),
});
