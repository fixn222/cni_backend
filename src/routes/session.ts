import type { Request, Response } from "express";

import { auth } from "../lib/auth.ts";
import { buildSessionUser } from "../lib/users.ts";

export const getSession = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    return res.status(200).json({
      authenticated: Boolean(session),
      user: await buildSessionUser(session?.user ?? null),
      session: session?.session ?? null,
    });
  } catch (error) {
    return res.status(500).json({
      authenticated: false,
      user: null,
      session: null,
      message: "Failed to fetch session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
