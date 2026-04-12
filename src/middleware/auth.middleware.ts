import type { Request, Response, NextFunction } from "express";
import  { auth } from "../lib/auth.ts";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    (req as any).user = session.user;
    return next();
  } catch (error) {
    return res.status(500).json({
      message: "Auth error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
