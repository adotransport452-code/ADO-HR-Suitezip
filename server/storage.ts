import { db } from "./db";
import {
  employees, leaves, meals, attendance, overtime, kitchenExpenses,
  type InsertEmployee, type InsertLeave, type InsertMeal,
  type InsertAttendance, type InsertOvertime, type InsertKitchenExpense
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getEmployees(): Promise<any[]>;
  createEmployee(employee: InsertEmployee): Promise<any>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<any>;
  deleteEmployee(id: number): Promise<void>;

  getLeaves(): Promise<any[]>;
  createLeave(leave: InsertLeave): Promise<any>;
  deleteLeave(id: number): Promise<void>;

  getMeals(): Promise<any[]>;
  setMeal(meal: InsertMeal): Promise<any>;

  getAttendance(): Promise<any[]>;
  setAttendance(record: InsertAttendance): Promise<any>;
  deleteAttendance(id: number): Promise<void>;

  getOvertime(): Promise<any[]>;
  createOvertime(record: InsertOvertime): Promise<any>;
  deleteOvertime(id: number): Promise<void>;

  getKitchenExpenses(): Promise<any[]>;
  createKitchenExpense(expense: InsertKitchenExpense): Promise<any>;
  updateKitchenExpense(id: number, expense: Partial<InsertKitchenExpense>): Promise<any>;
  deleteKitchenExpense(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getEmployees() {
    return await db.select().from(employees);
  }
  async createEmployee(employee: InsertEmployee) {
    const [res] = await db.insert(employees).values(employee).returning();
    return res;
  }
  async updateEmployee(id: number, employee: Partial<InsertEmployee>) {
    const [res] = await db.update(employees).set(employee).where(eq(employees.id, id)).returning();
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

  async getAttendance() {
    return await db.select().from(attendance);
  }
  async setAttendance(record: InsertAttendance) {
    const existing = await db.select().from(attendance).where(
      and(
        eq(attendance.employeeId, record.employeeId),
        eq(attendance.nepaliYear, record.nepaliYear),
        eq(attendance.nepaliMonth, record.nepaliMonth),
        eq(attendance.day, record.day)
      )
    );
    if (existing.length > 0) {
      const [res] = await db.update(attendance)
        .set({ status: record.status, checkInTime: record.checkInTime, checkOutTime: record.checkOutTime, remarks: record.remarks })
        .where(eq(attendance.id, existing[0].id))
        .returning();
      return res;
    } else {
      const [res] = await db.insert(attendance).values(record).returning();
      return res;
    }
  }
  async deleteAttendance(id: number) {
    await db.delete(attendance).where(eq(attendance.id, id));
  }

  async getOvertime() {
    return await db.select().from(overtime);
  }
  async createOvertime(record: InsertOvertime) {
    const [res] = await db.insert(overtime).values(record).returning();
    return res;
  }
  async deleteOvertime(id: number) {
    await db.delete(overtime).where(eq(overtime.id, id));
  }

  async getKitchenExpenses() {
    return await db.select().from(kitchenExpenses);
  }
  async createKitchenExpense(expense: InsertKitchenExpense) {
    const [res] = await db.insert(kitchenExpenses).values(expense).returning();
    return res;
  }
  async updateKitchenExpense(id: number, expense: Partial<InsertKitchenExpense>) {
    const [res] = await db.update(kitchenExpenses).set(expense).where(eq(kitchenExpenses.id, id)).returning();
    return res;
  }
  async deleteKitchenExpense(id: number) {
    await db.delete(kitchenExpenses).where(eq(kitchenExpenses.id, id));
  }
}

export const storage = new DatabaseStorage();
