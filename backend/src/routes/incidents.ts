import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// In-memory incidents cache fallback
let mockIncidents: any[] = [
  {
    id: "inc-1",
    userId: "default-driver-uuid",
    type: "POTHOLE",
    latitude: 37.7749,
    longitude: -122.4194,
    description: "Deep pothole in the middle lane. Warning!",
    severity: "HIGH",
    createdAt: new Date(),
  },
  {
    id: "inc-2",
    userId: "default-driver-uuid",
    type: "ACCIDENT",
    latitude: 37.7833,
    longitude: -122.4167,
    description: "Two-car fender bender. Left lane blocked.",
    severity: "MEDIUM",
    createdAt: new Date(),
  },
  {
    id: "inc-3",
    userId: "default-driver-uuid",
    type: "FLOOD",
    latitude: 37.7599,
    longitude: -122.4367,
    description: "Water accumulating near underpass. Low visibility.",
    severity: "HIGH",
    createdAt: new Date(),
  },
  {
    id: "inc-4",
    userId: "default-driver-uuid",
    type: "POLICE",
    latitude: 37.8044,
    longitude: -122.2712,
    description: "Speed trap near bridge exit.",
    severity: "LOW",
    createdAt: new Date(),
  }
];

// GET /api/incidents - get list of active incidents
router.get("/", async (req: Request, res: Response) => {
  try {
    let incidents = [];
    try {
      if (prisma) {
        incidents = await prisma.incidentReport.findMany({
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (e) {
      console.warn("DB connection failed for incidents, using memory fallback");
    }

    if (incidents.length === 0) {
      incidents = mockIncidents;
    }

    res.json({ success: true, data: incidents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/incidents/report - report a new incident
router.post("/report", async (req: Request, res: Response) => {
  try {
    const { type, latitude, longitude, description, severity } = req.body;
    const userId = (req as any).user?.id || "default-driver-uuid";

    if (!type || !latitude || !longitude) {
      return res.status(400).json({ success: false, error: "Type, latitude, and longitude are required." });
    }

    let report;
    try {
      if (prisma) {
        // First try to check if user exists in DB to satisfy foreign key, otherwise create mock user
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              id: userId,
              email: "driver@smartroute.ai",
              username: "smart_driver",
              fullName: "Smart Route Driver",
            }
          });
        }

        report = await prisma.incidentReport.create({
          data: {
            userId,
            type,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            description,
            severity: severity || "MEDIUM",
          },
        });
      }
    } catch (e: any) {
      console.warn("Could not save incident to DB, creating in memory:", e.message);
    }

    if (!report) {
      report = {
        id: `inc-${Date.now()}`,
        userId,
        type,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description,
        severity: severity || "MEDIUM",
        createdAt: new Date(),
      };
      mockIncidents.unshift(report);
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
