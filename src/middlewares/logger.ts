import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] ${method} ${url} ${status} - ${duration}ms`);
  });

  next();
};
