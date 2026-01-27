import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __persistencePrisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ log: ["error"] });
} else {
  if (!global.__persistencePrisma) {
    global.__persistencePrisma = new PrismaClient({ log: ["query", "error", "warn"] });
  }
  prisma = global.__persistencePrisma;
}

export { prisma };
