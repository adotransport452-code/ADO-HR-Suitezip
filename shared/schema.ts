import { pgTable, text, serial, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  designation: text("designation").notNull(),
  department: text("department").notNull().default(""),
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

export const officeExpenses = pgTable("office_expenses", {
  id: serial("id").primaryKey(),
  nepaliYear: integer("nepali_year").notNull(),
  nepaliMonth: integer("nepali_month").notNull(),
  day: integer("day").notNull(),
  itemName: text("item_name").notNull(),
  quantity: text("quantity"),
  amount: integer("amount").notNull(),
  remarks: text("remarks"),
});

export const salaries = pgTable("salaries", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  nepaliYear: integer("nepali_year").notNull(),
  nepaliMonth: integer("nepali_month").notNull(),
  totalSalary: integer("total_salary").notNull().default(0),
  providedSalary: integer("provided_salary").notNull().default(0),
  paymentType: text("payment_type"),
  paymentDate: text("payment_date"),
  notes: text("notes"),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: text("role").notNull().default("user"),
});

// ─── Insert Schemas ───────────────────────────────────────────
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertOvertimeSchema = createInsertSchema(overtime).omit({ id: true });
export const insertKitchenExpenseSchema = createInsertSchema(kitchenExpenses).omit({ id: true });
export const insertOfficeExpenseSchema = createInsertSchema(officeExpenses).omit({ id: true });
export const insertSalarySchema = createInsertSchema(salaries).omit({ id: true });

// ─── Types ────────────────────────────────────────────────────
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

export type OfficeExpense = typeof officeExpenses.$inferSelect;
export type InsertOfficeExpense = z.infer<typeof insertOfficeExpenseSchema>;

export type Salary = typeof salaries.$inferSelect;
export type InsertSalary = z.infer<typeof insertSalarySchema>;

export type Profile = typeof profiles.$inferSelect;
