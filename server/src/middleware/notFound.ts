import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";

export const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  const body: ApiResponse = {
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    message: "The requested endpoint does not exist on this server",
  };

  res.status(404).json(body);
};
