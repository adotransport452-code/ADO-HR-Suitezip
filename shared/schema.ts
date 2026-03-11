import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  nepaliYear: integer("nepali_year").notNull(),
  nepaliMonth: integer("nepali_month").notNull(),
  day: integer("day").notNull(),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  nepaliYear: integer("nepali_year").notNull(),
  nepaliMonth: integer("nepali_month").notNull(),
  day: integer("day").notNull(),
  mealStatus: text("meal_status").notNull().default("none"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true });

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
