import { useState } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useMeals, useToggleMeal } from "@/hooks/use-meals";
import { NEPALI_MONTHS, getDayOfWeek } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, UtensilsCrossed, Egg } from "lucide-react";

type MealStatus = "none" | "meal" | "meal_with_egg";

export default function MealExpenses() {
  const [selectedYear, setSelectedYear] = useState(2082);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const { data: employees, isLoading: loadingEmps } = useEmployees();
  const { data: meals, isLoading: loadingMeals } = useMeals();
  const toggleMeal = useToggleMeal();

  const getMealStatus = (empId: number, day: number): MealStatus => {
    const meal = meals?.find(m => m.employeeId === empId && m.nepaliYear === selectedYear && m.nepaliMonth === selectedMonth && m.day === day);
    return (meal?.mealStatus as MealStatus) ?? "none";
  };

  const getNextStatus = (currentStatus: MealStatus): MealStatus => {
    const cycle: Record<MealStatus, MealStatus> = {
      none: "meal",
      meal: "meal_with_egg",
      meal_with_egg: "none"
    };
    return cycle[currentStatus];
  };

  const handleToggle = (empId: number, day: number) => {
    const currentStatus = getMealStatus(empId, day);
    const nextStatus = getNextStatus(currentStatus);
    toggleMeal.mutate({
      employeeId: empId,
      nepaliYear: selectedYear,
      nepaliMonth: selectedMonth,
      day,
      mealStatus: nextStatus
    });
  };

  const renderMealIcon = (status: MealStatus) => {
    switch (status) {
      case "none":
        return <X className="w-4 h-4 opacity-30" />;
      case "meal":
        return <Check className="w-5 h-5" />;
      case "meal_with_egg":
        return (
          <div className="flex items-center gap-0.5">
            <Check className="w-5 h-5" />
            <Egg className="w-3 h-3" />
          </div>
        );
    }
  };

  const getStatusColor = (status: MealStatus) => {
    switch (status) {
      case "none":
        return "bg-transparent text-slate-300";
      case "meal":
        return "bg-emerald-500/10 text-emerald-600";
      case "meal_with_egg":
        return "bg-blue-500/10 text-blue-600";
    }
  };

  const isLoading = loadingEmps || loadingMeals;

  return (
    <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)]">
      <div className="shrink-0">
        <h1 className="text-3xl font-display font-bold text-foreground">Meal Expenses</h1>
        <p className="text-muted-foreground mt-1 text-sm">Track daily meal consumption for accurate expensing. Meal = Rs. 120, Meal with Egg = Rs. 145</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="flex gap-2 shrink-0 overflow-x-auto pb-2">
          {Array.from({ length: 103 }, (_, i) => 2080 + i).map(year => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              className={cn(
                "rounded-lg text-sm transition-all shrink-0",
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

      <div className="flex flex-wrap gap-2 shrink-0">
        {NEPALI_MONTHS.map(month => (
          <Button
            key={month.value}
            variant={selectedMonth === month.value ? "default" : "outline"}
            className={cn(
              "rounded-xl transition-all",
              selectedMonth === month.value 
                ? "shadow-md shadow-primary/20" 
                : "bg-card hover:bg-muted"
            )}
            onClick={() => setSelectedMonth(month.value)}
          >
            {month.label}
          </Button>
        ))}
      </div>

      <div className="flex-1 bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="w-12 h-12 mb-4 text-muted animate-pulse" />
            Loading meal records...
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <p>No employees found. Add employees in the Directory first.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 bg-muted/95 backdrop-blur px-4 py-3 text-left font-bold text-foreground border-b border-r min-w-[200px] shadow-[1px_1px_0_0_hsl(var(--border))]">
                    Employee Name
                  </th>
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    const dayOfWeek = getDayOfWeek(selectedMonth, day);
                    const dayAbbr = dayOfWeek.substring(0, 3);
                    return (
                      <th key={i} className="sticky top-0 z-20 bg-muted/95 backdrop-blur py-2 px-1 border-b border-r text-center font-bold text-foreground min-w-[48px] shadow-[0_1px_0_0_hsl(var(--border))]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs">{day}</span>
                          <span className="text-[9px] text-muted-foreground">{dayAbbr}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-card">
                {employees.map(emp => (
                  <tr key={emp.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/50 px-4 py-2 border-b border-r font-semibold text-foreground whitespace-nowrap shadow-[1px_0_0_0_hsl(var(--border))]">
                      <div className="flex flex-col">
                        <span>{emp.name}</span>
                        <span className="text-[10px] font-mono font-normal text-muted-foreground">{emp.employeeId}</span>
                      </div>
                    </td>
                    
                    {Array.from({ length: 31 }).map((_, i) => {
                      const day = i + 1;
                      const status = getMealStatus(emp.id, day);
                      
                      return (
                        <td 
                          key={day} 
                          onClick={() => handleToggle(emp.id, day)}
                          className="p-0 border-b border-r cursor-pointer relative"
                        >
                          <div className={cn(
                            "w-full h-full min-h-[52px] flex items-center justify-center transition-all group/cell",
                            getStatusColor(status),
                            "hover:bg-muted/20"
                          )}>
                            {renderMealIcon(status)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
