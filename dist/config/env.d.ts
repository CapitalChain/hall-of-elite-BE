import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodString;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    /** Comma-separated list of additional CORS origins (e.g. production frontend URL) */
    CORS_ORIGINS: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    MT5_SERVER: z.ZodOptional<z.ZodString>;
    MT5_LOGIN: z.ZodOptional<z.ZodString>;
    MT5_PASSWORD: z.ZodOptional<z.ZodString>;
    MT5_API_URL: z.ZodOptional<z.ZodString>;
    MT5_API_KEY: z.ZodOptional<z.ZodString>;
    MT5_RETRY_ATTEMPTS: z.ZodDefault<z.ZodString>;
    MT5_RETRY_DELAY_MS: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DATABASE_URL: string;
    CORS_ORIGIN: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    MT5_RETRY_ATTEMPTS: string;
    MT5_RETRY_DELAY_MS: string;
    CORS_ORIGINS?: string | undefined;
    MT5_SERVER?: string | undefined;
    MT5_LOGIN?: string | undefined;
    MT5_PASSWORD?: string | undefined;
    MT5_API_URL?: string | undefined;
    MT5_API_KEY?: string | undefined;
}, {
    DATABASE_URL: string;
    JWT_SECRET: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: string | undefined;
    CORS_ORIGIN?: string | undefined;
    CORS_ORIGINS?: string | undefined;
    JWT_EXPIRES_IN?: string | undefined;
    MT5_SERVER?: string | undefined;
    MT5_LOGIN?: string | undefined;
    MT5_PASSWORD?: string | undefined;
    MT5_API_URL?: string | undefined;
    MT5_API_KEY?: string | undefined;
    MT5_RETRY_ATTEMPTS?: string | undefined;
    MT5_RETRY_DELAY_MS?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DATABASE_URL: string;
    CORS_ORIGIN: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    MT5_RETRY_ATTEMPTS: string;
    MT5_RETRY_DELAY_MS: string;
    CORS_ORIGINS?: string | undefined;
    MT5_SERVER?: string | undefined;
    MT5_LOGIN?: string | undefined;
    MT5_PASSWORD?: string | undefined;
    MT5_API_URL?: string | undefined;
    MT5_API_KEY?: string | undefined;
};
export {};
//# sourceMappingURL=env.d.ts.map