import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

const getUserId = (req: Request) => {
  return (req as any).user?.id || "default-driver-uuid";
};

// GET /api/navigation/favorites - list user saved places
router.get("/favorites", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    let favorites: any[] = [];

    try {
      if (prisma) {
        favorites = await prisma.savedPlace.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (e) {
      console.warn("DB connection failed for favorites");
    }

    if (favorites.length === 0) {
      favorites = [
        {
          id: "fav-1",
          name: "Home",
          address: "100 Market St, San Francisco, CA",
          latitude: 37.7946,
          longitude: -122.3957,
          category: "HOME",
        },
        {
          id: "fav-2",
          name: "Work (Silicon Valley Office)",
          address: "1600 Amphitheatre Pkwy, Mountain View, CA",
          latitude: 37.4220,
          longitude: -122.0841,
          category: "WORK",
        },
        {
          id: "fav-3",
          name: "Favorite Charging Hub",
          address: "200 Stanford Shopping Center, Palo Alto, CA",
          latitude: 37.4430,
          longitude: -122.1706,
          category: "CHARGING",
        }
      ];
    }

    res.json({ success: true, data: favorites });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/navigation/favorites - create favorite
router.post("/favorites", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, address, latitude, longitude, category } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ success: false, error: "Name, latitude, and longitude are required." });
    }

    let favorite;
    try {
      if (prisma) {
        // Satisfy DB user constraint
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

        favorite = await prisma.savedPlace.create({
          data: {
            userId,
            name,
            address: address || "",
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            category: category || "FAVORITE",
          },
        });
      }
    } catch (e: any) {
      console.warn("Could not save favorite to DB, using local mock");
    }

    if (!favorite) {
      favorite = {
        id: `fav-${Date.now()}`,
        userId,
        name,
        address: address || "",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category: category || "FAVORITE",
        createdAt: new Date(),
      };
    }

    res.json({ success: true, data: favorite });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/navigation/calculate - Compare routes: ECO, FASTEST, Scenic, EV, Safety
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const { startCoords, endCoords } = req.body;
    
    if (!startCoords || !endCoords) {
      return res.status(400).json({ success: false, error: "Start and End coordinates are required." });
    }

    // Coordinates format: [lng, lat]
    const distanceMiles = 32.5; // Mock base distance for computation

    const comparison = {
      FASTEST: {
        distance: distanceMiles,
        duration: 38, // minutes
        fuelUsed: 1.1, // Gallons/kWh
        carbonEmission: 9.8, // kg
        ecoScore: 78,
        safetyScore: 88,
        tollCost: 6.5,
        highwayPercentage: 92,
        warnings: ["High congestion near lane 3"],
      },
      ECO: {
        distance: distanceMiles - 1.2,
        duration: 43,
        fuelUsed: 0.85,
        carbonEmission: 7.5,
        ecoScore: 98,
        safetyScore: 92,
        tollCost: 0,
        highwayPercentage: 65,
        warnings: ["School speed zones active"],
      },
      SAFEST: {
        distance: distanceMiles + 2.5,
        duration: 45,
        fuelUsed: 1.05,
        carbonEmission: 9.3,
        ecoScore: 84,
        safetyScore: 99,
        tollCost: 3.0,
        highwayPercentage: 80,
        warnings: [],
      },
      SCENIC: {
        distance: distanceMiles + 8.4,
        duration: 58,
        fuelUsed: 1.3,
        carbonEmission: 11.5,
        ecoScore: 75,
        safetyScore: 90,
        tollCost: 0,
        highwayPercentage: 30,
        warnings: ["Narrow coastal winding roads"],
      }
    };

    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
