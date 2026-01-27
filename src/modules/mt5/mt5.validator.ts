/**
 * MT5 validators.
 * Created to validate MT5 route params and query strings.
 */
import { z } from "zod";

/**
 * Validator for MT5 route parameters
 */
export const getTradesParamsSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
});

/**
 * Validator for MT5 query parameters (trades with date range)
 */
export const getTradesQuerySchema = z.object({
  startDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)" }
    ),
  endDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)" }
    ),
});
