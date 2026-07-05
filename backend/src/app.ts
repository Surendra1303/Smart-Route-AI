import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
registerRoutes(app);

export default app;
