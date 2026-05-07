import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { supabaseAdmin } from "./supabase";

// ─── Auth helpers ─────────────────────────────────────────────

async function getAuthUser(req: Request) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getUserRole(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
  return data?.role ?? null;
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const role = await getUserRole(user.id);
  if (role !== "admin") return res.status(403).json({ message: "Forbidden: Admin only" });
  (req as any).authUser = user;
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── Public config (Supabase anon key for frontend) ───────
  app.get("/api/config", (_req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
    });
  });

  // ─── Employees ────────────────────────────────────────────
  app.get("/api/employees", async (_req, res) => {
    try { res.json(await storage.getEmployees()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/employees", async (req, res) => {
    try { res.status(201).json(await storage.createEmployee(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.patch("/api/employees/:id", async (req, res) => {
    try { res.json(await storage.updateEmployee(Number(req.params.id), req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/employees/:id", async (req, res) => {
    try { await storage.deleteEmployee(Number(req.params.id)); res.status(204).send(); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Leaves ───────────────────────────────────────────────
  app.get("/api/leaves", async (_req, res) => {
    try { res.json(await storage.getLeaves()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/leaves", async (req, res) => {
    try { res.status(201).json(await storage.createLeave(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/leaves/:id", async (req, res) => {
    try { await storage.deleteLeave(Number(req.params.id)); res.status(204).send(); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Meals ────────────────────────────────────────────────
  app.get("/api/meals", async (_req, res) => {
    try { res.json(await storage.getMeals()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/meals", async (req, res) => {
    try { res.status(201).json(await storage.setMeal(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Attendance ───────────────────────────────────────────
  app.get("/api/attendance", async (_req, res) => {
    try { res.json(await storage.getAttendance()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/attendance", async (req, res) => {
    try { res.status(201).json(await storage.setAttendance(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/attendance/:id", async (req, res) => {
    try { await storage.deleteAttendance(Number(req.params.id)); res.status(204).send(); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Overtime ─────────────────────────────────────────────
  app.get("/api/overtime", async (_req, res) => {
    try { res.json(await storage.getOvertime()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/overtime", async (req, res) => {
    try { res.status(201).json(await storage.createOvertime(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.patch("/api/overtime/:id", async (req, res) => {
    try { res.json(await storage.updateOvertime(Number(req.params.id), req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/overtime/:id", async (req, res) => {
    try { await storage.deleteOvertime(Number(req.params.id)); res.status(204).send(); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Kitchen Expenses ─────────────────────────────────────
  app.get("/api/kitchen-expenses", async (_req, res) => {
    try { res.json(await storage.getKitchenExpenses()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/kitchen-expenses", async (req, res) => {
    try { res.status(201).json(await storage.createKitchenExpense(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.patch("/api/kitchen-expenses/:id", async (req, res) => {
    try { res.json(await storage.updateKitchenExpense(Number(req.params.id), req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/kitchen-expenses/:id", async (req, res) => {
    try { await storage.deleteKitchenExpense(Number(req.params.id)); res.status(204).send(); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Office Expenses ──────────────────────────────────────
  app.get("/api/office-expenses", async (_req, res) => {
    try { res.json(await storage.getOfficeExpenses()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/office-expenses", async (req, res) => {
    try { res.status(201).json(await storage.createOfficeExpense(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.patch("/api/office-expenses/:id", async (req, res) => {
    try { res.json(await storage.updateOfficeExpense(Number(req.params.id), req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/office-expenses/:id", async (req, res) => {
    try { await storage.deleteOfficeExpense(Number(req.params.id)); res.status(204).send(); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Salaries ─────────────────────────────────────────────
  app.get("/api/salaries", async (_req, res) => {
    try { res.json(await storage.getSalaries()); }
    catch (err: any) { res.status(500).json({ message: err.message }); }
  });
  app.post("/api/salaries", async (req, res) => {
    try { res.status(201).json(await storage.setSalary(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.patch("/api/salaries/:id", async (req, res) => {
    try { res.json(await storage.updateSalary(Number(req.params.id), req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/salaries/:id", async (req, res) => {
    try { await storage.deleteSalary(Number(req.params.id)); res.status(204).send(); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // ─── Admin: User Management (admin-only) ──────────────────
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) return res.status(400).json({ message: error.message });

      const profile = await storage.createProfile({
        id: data.user.id,
        email,
        fullName: fullName ?? null,
        role: role ?? "user",
      });
      res.status(201).json(profile);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { fullName, role, password } = req.body;
      const userId = req.params.id;

      if (password) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        if (error) return res.status(400).json({ message: error.message });
      }

      const profile = await storage.updateProfile(userId, { fullName, role });
      res.json(profile);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await storage.deleteProfile(userId);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  return httpServer;
}
