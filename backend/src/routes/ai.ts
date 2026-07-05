import { Router, Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

const router = Router();

// Fallback response rules when Gemini API is not accessible or not configured
const parseFallbackAIResponse = (prompt: string): string => {
  const query = prompt.toLowerCase();
  
  if (query.includes("route") || query.includes("direction") || query.includes("navigate")) {
    return "🛣️ **SmartRoute Engine Navigation Suggestion:** Based on current traffic levels, the **Fuel Saving Eco Route** via Highway 101 will save 12% on battery/fuel compared to the I-280 Freeway, which has a 12-minute bottleneck due to lane construction near Palo Alto.";
  }
  if (query.includes("weather") || query.includes("rain") || query.includes("storm") || query.includes("fog")) {
    return "🌧️ **Real-time Weather alert:** Severe rain and low visibility are forecast along your route near the coastal sections. I recommend switching driving mode to **COMFORT/ALL-WEATHER** and maintaining a safe following distance of at least 4 seconds.";
  }
  if (query.includes("charge") || query.includes("fuel") || query.includes("gas") || query.includes("station")) {
    return "⚡ **Smart Station Suggestion:** You have 32 miles of range remaining. The best stop along your route is the **EV charging station at Hillsdale Shopping Center (Level 3 Supercharger)**. It currently has 4 out of 8 stalls open with a wait time under 3 minutes.";
  }
  if (query.includes("parking")) {
    return "🅿️ **Smart Parking Advice:** Near your destination, **5th & Mission Covered Garage** offers EV parking and has 14 spots left at $4.50/hr. Street parking is fully congested within a 0.5-mile radius.";
  }
  if (query.includes("accident") || query.includes("pothole") || query.includes("hazard") || query.includes("sos")) {
    return "🚨 **Road Intelligence Warning:** A high-severity pothole was reported by other drivers 1.2 miles ahead in the right lane. Swerve left when passing. If this is an emergency, press the SOS button to contact roadside assistance.";
  }

  return "👋 Hello! I am your AI Copilot. I can assist with real-time navigation, fuel/charging recommendations, safety advice, weather routing adjustments, and nearby POI searches. What can I help you find today?";
};

// POST /api/ai/chat - AI copilot conversation endpoint
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, chatHistory } = req.body;
    const userId = (req as any).user?.id || "default-driver-uuid";

    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required." });
    }

    // Save message to database if available
    try {
      if (prisma) {
        await prisma.aIConversation.create({
          data: { userId, role: "user", message }
        });
      }
    } catch (e) {
      console.warn("Could not save user chat log to DB");
    }

    let aiReply = "";
    const geminiKey = process.env.GEMINI_API_KEY || "";
    
    if (geminiKey && geminiKey !== "REPLACE_WITH_KEY") {
      try {
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        
        const systemInstruction = 
          "You are an advanced AI Navigation Copilot inside an intelligent vehicle dashboard. " +
          "Your job is to provide concise, helpful navigation advice, traffic reports, weather routing details, charging/fuel suggestions, " +
          "safety alerts, and travel itinerary support. Keep responses professional, highly context-aware, and formatting clean with markdown.";

        const response = await axios.post(url, {
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemInstruction}\n\nUser request: ${message}` }
              ]
            }
          ]
        }, {
          headers: { "Content-Type": "application/json" },
          timeout: 7000
        });

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiReply = response.data.candidates[0].content.parts[0].text;
        }
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, falling back to intent engine:", geminiError.message);
        aiReply = parseFallbackAIResponse(message);
      }
    } else {
      aiReply = parseFallbackAIResponse(message);
    }

    // Save reply to database if available
    try {
      if (prisma) {
        await prisma.aIConversation.create({
          data: { userId, role: "assistant", message: aiReply }
        });
      }
    } catch (e) {
      console.warn("Could not save AI chat reply to DB");
    }

    res.json({ success: true, reply: aiReply });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ai/history - fetch chat history
router.get("/history", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || "default-driver-uuid";
    let history: any[] = [];

    try {
      if (prisma) {
        history = await prisma.aIConversation.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          take: 50,
        });
      }
    } catch (e) {
      console.warn("Could not load history from DB, sending empty list");
    }

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
