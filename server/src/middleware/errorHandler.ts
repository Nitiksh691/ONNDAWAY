import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";
import { ApiResponse } from "../types";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`❌ [${req.method} ${req.originalUrl}]`, err.message);

  if (config.isDev) {
    console.error(err.stack);
  }

  const body: ApiResponse = {
    success: false,
    error: err.message || "Internal Server Error",
    ...(config.isDev && { message: err.stack }),
  };

  res.status(500).json(body);
};
