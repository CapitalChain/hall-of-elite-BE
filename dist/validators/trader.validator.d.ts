import { z } from "zod";
export declare const getTraderParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const getTradersQuerySchema: z.ZodObject<{
    page: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
    tier: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    tier?: string | undefined;
}, {
    limit?: string | undefined;
    tier?: string | undefined;
    page?: string | undefined;
}>;
//# sourceMappingURL=trader.validator.d.ts.map