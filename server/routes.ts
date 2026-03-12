import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ─── Employees ───────────────────────────────────────────────
  app.get("/api/employees", async (_req, res) => {
    res.json(await storage.getEmployees());
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const data = await storage.createEmployee(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const data = await storage.updateEmployee(Number(req.params.id), req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    await storage.deleteEmployee(Number(req.params.id));
    res.status(204).send();
  });

  // ─── Leaves ──────────────────────────────────────────────────
  app.get("/api/leaves", async (_req, res) => {
    res.json(await storage.getLeaves());
  });

  app.post("/api/leaves", async (req, res) => {
    try {
      const data = await storage.createLeave(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/leaves/:id", async (req, res) => {
    await storage.deleteLeave(Number(req.params.id));
    res.status(204).send();
  });

  // ─── Meals ────────────────────────────────────────────────────
  app.get("/api/meals", async (_req, res) => {
    res.json(await storage.getMeals());
  });

  app.post("/api/meals", async (req, res) => {
    try {
      const data = await storage.setMeal(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Attendance ───────────────────────────────────────────────
  app.get("/api/attendance", async (_req, res) => {
    res.json(await storage.getAttendance());
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const data = await storage.setAttendance(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    await storage.deleteAttendance(Number(req.params.id));
    res.status(204).send();
  });

  // ─── Overtime ─────────────────────────────────────────────────
  app.get("/api/overtime", async (_req, res) => {
    res.json(await storage.getOvertime());
  });

  app.post("/api/overtime", async (req, res) => {
    try {
      const data = await storage.createOvertime(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/overtime/:id", async (req, res) => {
    await storage.deleteOvertime(Number(req.params.id));
    res.status(204).send();
  });

  // ─── Kitchen Expenses ─────────────────────────────────────────
  app.get("/api/kitchen-expenses", async (_req, res) => {
    res.json(await storage.getKitchenExpenses());
  });

  app.post("/api/kitchen-expenses", async (req, res) => {
    try {
      const data = await storage.createKitchenExpense(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/kitchen-expenses/:id", async (req, res) => {
    try {
      const data = await storage.updateKitchenExpense(Number(req.params.id), req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/kitchen-expenses/:id", async (req, res) => {
    await storage.deleteKitchenExpense(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
