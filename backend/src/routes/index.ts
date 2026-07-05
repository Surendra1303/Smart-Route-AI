import { Express } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import vehicleRoutes from "./vehicle";
import incidentRoutes from "./incidents";
import navigationRoutes from "./navigation";
import aiRoutes from "./ai";

export function registerRoutes(app: Express) {
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/vehicle", vehicleRoutes);
  app.use("/api/incidents", incidentRoutes);
  app.use("/api/navigation", navigationRoutes);
  app.use("/api/ai", aiRoutes);
}

