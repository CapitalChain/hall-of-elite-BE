import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";

export class BaseRepository<T extends { id: string }> {
  protected client: PrismaClient;
  protected model: keyof PrismaClient;

  constructor(model: keyof PrismaClient) {
    this.client = prisma;
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    const model = this.client[this.model] as any;
    return model.findUnique({
      where: { id },
    }) as Promise<T | null>;
  }

  async findMany(
    where?: Record<string, unknown>,
    options?: {
      take?: number;
      skip?: number;
      orderBy?: Record<string, "asc" | "desc">;
    }
  ): Promise<T[]> {
    const model = this.client[this.model] as any;
    const query: any = {};

    if (where) {
      query.where = where;
    }

    if (options?.take) {
      query.take = options.take;
    }

    if (options?.skip) {
      query.skip = options.skip;
    }

    if (options?.orderBy) {
      query.orderBy = options.orderBy;
    }

    return model.findMany(query) as Promise<T[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    const model = this.client[this.model] as any;
    const query: any = {};

    if (where) {
      query.where = where;
    }

    return model.count(query) as Promise<number>;
  }

  async findFirst(
    where?: Record<string, unknown>
  ): Promise<T | null> {
    const model = this.client[this.model] as any;
    const query: any = {};

    if (where) {
      query.where = where;
    }

    return model.findFirst(query) as Promise<T | null>;
  }
}
