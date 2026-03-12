import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
  contactNumber: text("contact_number"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  dateOfJoining: text("date_of_joining"),
  bankAccountNumber: text("bank_account_number"),
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

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  nepaliYear: integer("nepali_year").notNull(),
  nepaliMonth: integer("nepali_month").notNull(),
  day: integer("day").notNull(),
  status: text("status").notNull().default("present"),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  remarks: text("remarks"),
});

export const overtime = pgTable("overtime", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  nepaliYear: integer("nepali_year").notNull(),
  nepaliMonth: integer("nepali_month").notNull(),
  day: integer("day").notNull(),
  overtimeHours: text("overtime_hours").notNull(),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  remarks: text("remarks"),
});

export const kitchenExpenses = pgTable("kitchen_expenses", {
  id: serial("id").primaryKey(),
  nepaliYear: integer("nepali_year").notNull(),
  nepaliMonth: integer("nepali_month").notNull(),
  day: integer("day").notNull(),
  itemName: text("item_name").notNull(),
  quantity: text("quantity"),
  amount: integer("amount").notNull(),
  remarks: text("remarks"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertOvertimeSchema = createInsertSchema(overtime).omit({ id: true });
export const insertKitchenExpenseSchema = createInsertSchema(kitchenExpenses).omit({ id: true });

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Overtime = typeof overtime.$inferSelect;
export type InsertOvertime = z.infer<typeof insertOvertimeSchema>;

export type KitchenExpense = typeof kitchenExpenses.$inferSelect;
export type InsertKitchenExpense = z.infer<typeof insertKitchenExpenseSchema>;
