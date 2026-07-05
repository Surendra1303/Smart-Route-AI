import jwt from "jsonwebtoken";
import { Response } from "express";
import { env } from "../config/env";

export function buildGoogleAccountUsername(googleId: string) {
  return `user_${googleId.replace(/\D/g, "").slice(-10) || googleId.slice(-10)}`;
}

export function issueAuthResponse(user: {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  routePreference?: string;
  ecoPoints?: number;
}, res: Response) {
  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      routePreference: user.routePreference || "FASTEST",
      ecoPoints: user.ecoPoints || 0,
    },
  });
}

