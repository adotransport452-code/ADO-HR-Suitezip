import { useState } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useMeals } from "@/hooks/use-meals";
import { useLeaves } from "@/hooks/use-leaves";
import { NEPALI_MONTHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const MEAL_RATES = {
  meal: 120,
  meal_with_egg: 145,
  none: 0,
};

export default function Overall() {
  const [selectedYear, setSelectedYear] = useState(2082);
  const { data: employees, isLoading: loadingEmps } = useEmployees();
  const { data: meals, isLoading: loadingMeals } = useMeals();
  const { data: leaves, isLoading: loadingLeaves } = useLeaves();

  const calculateLeavesPerMonth = (empId: number, month: number): number => {
    return (leaves ?? []).filter(
      (l) => l.employeeId === empId && l.nepaliYear === selectedYear && l.nepaliMonth === month
    ).length;
  };

  const calculateMealExpense = (empId: number, month: number): number => {
    const mealRecords = (meals ?? []).filter(
      (m) => m.employeeId === empId && m.nepaliYear === selectedYear && m.nepaliMonth === month
    );
    return mealRecords.reduce((total, record) => {
      const status = record.mealStatus as keyof typeof MEAL_RATES;
      return total + (MEAL_RATES[status] || 0);
    }, 0);
  };

  const isLoading = loadingEmps || loadingMeals || loadingLeaves;

  return (
    <div className="space-y-8 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Overall Report</h1>
          <p className="text-muted-foreground mt-1 text-sm">Year {selectedYear} B.S. - Comprehensive view of all employee leaves and meal expenses.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 103 }, (_, i) => 2080 + i).map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              className={cn(
                "rounded-xl transition-all",
                selectedYear === year 
                  ? "shadow-md shadow-primary/20" 
                  : "bg-card hover:bg-muted"
              )}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mb-4 text-muted animate-pulse" />
          Loading reports...
        </div>
      ) : !employees || employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>No employees found. Add employees in the Directory first.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-muted/50 px-6 py-4 border-b border-border/50">
                <h2 className="font-bold text-lg text-foreground">{emp.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {emp.employeeId} | Designation: {emp.designation} | Department: {emp.department}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/25">
                      <th className="px-6 py-3 text-left font-bold text-foreground">Month</th>
                      <th className="px-6 py-3 text-center font-bold text-foreground">Total Leaves</th>
                      <th className="px-6 py-3 text-right font-bold text-foreground">Meal Expense (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NEPALI_MONTHS.map((month) => {
                      const leaveCount = calculateLeavesPerMonth(emp.id, month.value);
                      const mealExpense = calculateMealExpense(emp.id, month.value);
                      return (
                        <tr key={month.value} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-3 font-medium text-foreground">{month.label}</td>
                          <td className="px-6 py-3 text-center">
                            {leaveCount > 0 ? (
                              <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/15 text-amber-700 font-semibold">
                                {leaveCount}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {mealExpense > 0 ? (
                              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 font-semibold">
                                Rs. {mealExpense}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/25 border-t-2 border-border/50">
                    <tr>
                      <td className="px-6 py-3 font-bold text-foreground">Total</td>
                      <td className="px-6 py-3 text-center font-bold text-foreground">
                        {NEPALI_MONTHS.reduce((sum, m) => sum + calculateLeavesPerMonth(emp.id, m.value), 0)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-foreground">
                        Rs. {NEPALI_MONTHS.reduce((sum, m) => sum + calculateMealExpense(emp.id, m.value), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
