import { useState, useEffect } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useLeaves, useCreateLeave, useDeleteLeave } from "@/hooks/use-leaves";
import { NEPALI_MONTHS } from "@/lib/constants";
import { getCurrentNepaliDate, getDaysInNepaliMonth } from "@/lib/nepaliDate";
import { getMonthCalendar } from "@/lib/calendarUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Plus, Info, User, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function LeaveReport() {
  const [selectedYear, setSelectedYear] = useState(2082);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailDay, setDetailDay] = useState<number | null>(null);
  const [multiSelectDay, setMultiSelectDay] = useState<number | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());

  const { data: employees } = useEmployees();
  const { data: leaves } = useLeaves();
  const createLeave = useCreateLeave();
  const deleteLeave = useDeleteLeave();

  // Initialize with current Nepali date
  useEffect(() => {
    const today = getCurrentNepaliDate();
    setSelectedYear(today.year);
    setSelectedMonth(today.month);
  }, []);

  const monthLeaves = leaves?.filter(l => l.nepaliYear === selectedYear && l.nepaliMonth === selectedMonth) || [];
  
  const leavesByDay = new Map<number, typeof leaves>();
  monthLeaves.forEach(l => {
    const existing = leavesByDay.get(l.day) || [];
    leavesByDay.set(l.day, [...existing, l]);
  });

  const handleAddLeave = (selectedDay: number) => {
    if (!selectedDay) return;
    setMultiSelectDay(selectedDay);
  };

  const handleAddMultipleLeaves = () => {
    if (multiSelectDay === null) return;
    
    selectedEmployees.forEach(empId => {
      createLeave.mutate({
        employeeId: empId,
        nepaliYear: selectedYear,
        nepaliMonth: selectedMonth,
        day: multiSelectDay
      });
    });
    
    setSelectedEmployees(new Set());
    setMultiSelectDay(null);
  };

  const getEmployee = (id: number) => employees?.find(e => e.id === id);
  const detailLeaves = detailDay ? (leavesByDay.get(detailDay) || []) : [];

  const calendarDays = getMonthCalendar(selectedYear, selectedMonth);
  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Report</h1>
          <p className="text-muted-foreground mt-1 text-sm">Click on any date to add leaves for multiple employees.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

      <div className="flex flex-wrap gap-2 mb-6">
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

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-medium">
          <Info className="w-4 h-4" /> Click on any date to view or add employee leaves.
        </div>
        
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs font-bold text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, idx) => {
            if (!dayInfo.isCurrentMonth) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square p-2 rounded-lg bg-muted/30"
                />
              );
            }

            const day = dayInfo.day;
            const dayLeaves = leavesByDay.get(day) || [];
            
            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  if (dayLeaves.length > 0) {
                    setDetailDay(day);
                  } else {
                    handleAddLeave(day);
                  }
                }}
                className={cn(
                  "aspect-square p-2 rounded-lg border transition-all text-sm font-semibold flex flex-col items-center justify-center relative",
                  dayLeaves.length > 0 
                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer" 
                    : "border-border/50 hover:bg-muted/50 cursor-pointer"
                )}
              >
                <span>{day}</span>
                {dayLeaves.length > 0 && (
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1 rounded-full mt-0.5">
                    {dayLeaves.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailDay} onOpenChange={(val) => !val && setDetailDay(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary" />
              Leaves on Day {detailDay}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {detailLeaves.map(leave => {
              const emp = getEmployee(leave.employeeId);
              if (!emp) return null;
              return (
                <div key={leave.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card shadow-sm">
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      {emp.name} <span className="text-xs font-mono font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-md">{emp.employeeId}</span>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{emp.designation} • {emp.department}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Remove this leave record?")) {
                        deleteLeave.mutate(leave.id);
                      }
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-select Dialog */}
      <Dialog open={!!multiSelectDay} onOpenChange={(val) => !val && setMultiSelectDay(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Add Leaves for Day {multiSelectDay}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">Select employees who are on leave this day</p>
          </DialogHeader>
          
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {employees?.map(emp => {
              const isSelected = selectedEmployees.has(emp.id);
              const alreadyHasLeave = leavesByDay.get(multiSelectDay || 0)?.some(l => l.employeeId === emp.id);
              
              return (
                <label 
                  key={emp.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                    isSelected 
                      ? "bg-primary/10 border-primary/30 shadow-sm" 
                      : alreadyHasLeave
                      ? "bg-muted/30 border-border/50 opacity-60 cursor-not-allowed"
                      : "bg-card border-border/50 hover:bg-muted/20"
                  )}
                >
                  <Checkbox 
                    checked={isSelected}
                    disabled={alreadyHasLeave}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(selectedEmployees);
                      if (checked) {
                        newSet.add(emp.id);
                      } else {
                        newSet.delete(emp.id);
                      }
                      setSelectedEmployees(newSet);
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {emp.name}
                      {alreadyHasLeave && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{emp.designation} • {emp.department}</div>
                  </div>
                </label>
              );
            })}
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl"
              onClick={() => setMultiSelectDay(null)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl"
              disabled={selectedEmployees.size === 0 || createLeave.isPending}
              onClick={handleAddMultipleLeaves}
            >
              {createLeave.isPending ? "Saving..." : `Add ${selectedEmployees.size} Leave${selectedEmployees.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
