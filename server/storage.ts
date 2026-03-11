import { db } from "./db";
import { employees, leaves, meals, type InsertEmployee, type InsertLeave, type InsertMeal } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getEmployees(): Promise<any[]>;
  createEmployee(employee: InsertEmployee): Promise<any>;
  deleteEmployee(id: number): Promise<void>;
  
  getLeaves(): Promise<any[]>;
  createLeave(leave: InsertLeave): Promise<any>;
  deleteLeave(id: number): Promise<void>;
  
  getMeals(): Promise<any[]>;
  setMeal(meal: InsertMeal): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getEmployees() {
    return await db.select().from(employees);
  }
  async createEmployee(employee: InsertEmployee) {
    const [res] = await db.insert(employees).values(employee).returning();
    return res;
  }
  async deleteEmployee(id: number) {
    await db.delete(employees).where(eq(employees.id, id));
  }
  
  async getLeaves() {
    return await db.select().from(leaves);
  }
  async createLeave(leave: InsertLeave) {
    const [res] = await db.insert(leaves).values(leave).returning();
    return res;
  }
  async deleteLeave(id: number) {
    await db.delete(leaves).where(eq(leaves.id, id));
  }
  
  async getMeals() {
    return await db.select().from(meals);
  }
  async setMeal(meal: InsertMeal) {
    const existing = await db.select().from(meals).where(
      and(
        eq(meals.employeeId, meal.employeeId),
        eq(meals.nepaliYear, meal.nepaliYear),
        eq(meals.nepaliMonth, meal.nepaliMonth),
        eq(meals.day, meal.day)
      )
    );
    if (existing.length > 0) {
      const [res] = await db.update(meals)
        .set({ mealStatus: meal.mealStatus })
        .where(eq(meals.id, existing[0].id))
        .returning();
      return res;
    } else {
      const [res] = await db.insert(meals).values(meal).returning();
      return res;
    }
  }
}

export const storage = new DatabaseStorage();
