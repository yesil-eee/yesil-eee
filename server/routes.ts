import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // This application primarily uses frontend local storage
  // The backend is minimal since CSV operations happen client-side
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "İşlem Takibi API is running" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
