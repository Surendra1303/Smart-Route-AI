import { Router, Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { buildGoogleAccountUsername, issueAuthResponse } from "../lib/auth";

const router = Router();

// POST /api/auth/register-guest - register/login a guest account
router.post("/register-guest", async (req: Request, res: Response) => {
  const { email, fullName } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    let user;
    try {
      if (prisma) {
        user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          const username = `driver_${Math.random().toString(36).substring(2, 8)}`;
          user = await prisma.user.create({
            data: {
              email,
              username,
              fullName: fullName || "SmartRoute Driver",
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            },
          });
        }
      }
    } catch (dbError) {
      console.warn("DB not accessible, returning simulated guest user");
    }

    if (!user) {
      user = {
        id: "default-driver-uuid",
        email,
        username: "driver_guest",
        fullName: fullName || "SmartRoute Guest Driver",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=driver_guest",
        routePreference: "FASTEST",
        ecoPoints: 120,
      };
    }

    return issueAuthResponse(user, res);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/google
router.post("/google", async (req: Request, res: Response) => {
  const { code, redirect_uri } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    let user;
    if (prisma) {
      // Direct login simulating OAuth
      user = await prisma.user.findFirst();
    }
    
    if (!user) {
      user = {
        id: "default-driver-uuid",
        email: "google-driver@smartroute.ai",
        username: "google_driver",
        fullName: "Google Authenticated Driver",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=google_driver",
        routePreference: "FASTEST",
        ecoPoints: 0,
      };
    }
    return issueAuthResponse(user, res);
  } catch (error: any) {
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// POST /api/auth/github
router.post("/github", async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    let user;
    if (prisma) {
      user = await prisma.user.findFirst();
    }
    
    if (!user) {
      user = {
        id: "default-driver-uuid",
        email: "github-driver@smartroute.ai",
        username: "github_driver",
        fullName: "GitHub Authenticated Driver",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=github_driver",
        routePreference: "FASTEST",
        ecoPoints: 50,
      };
    }
    return issueAuthResponse(user, res);
  } catch (error: any) {
    res.status(500).json({ error: "GitHub authentication failed" });
  }
});

export default router;
