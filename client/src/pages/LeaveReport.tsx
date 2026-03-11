import { useState } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useLeaves, useCreateLeave, useDeleteLeave } from "@/hooks/use-leaves";
import { NEPALI_MONTHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Form State for single add
  const [formEmpId, setFormEmpId] = useState("");
  const [formMonth, setFormMonth] = useState(selectedMonth.toString());
  const [formDay, setFormDay] = useState("");

  const monthLeaves = leaves?.filter(l => l.nepaliYear === selectedYear && l.nepaliMonth === selectedMonth) || [];
  
  const leavesByDay = new Map<number, typeof leaves>();
  monthLeaves.forEach(l => {
    const existing = leavesByDay.get(l.day) || [];
    leavesByDay.set(l.day, [...existing, l]);
  });

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId || !formMonth || !formDay) return;
    
    createLeave.mutate({
      employeeId: Number(formEmpId),
      nepaliYear: selectedYear,
      nepaliMonth: Number(formMonth),
      day: Number(formDay)
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormEmpId("");
        setFormDay("");
      }
    });
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Report</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track team attendance and scheduled time off.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Log Employee Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLeave} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Employee</label>
                <Select value={formEmpId} onValueChange={setFormEmpId} required>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} <span className="text-muted-foreground text-xs ml-2">({emp.employeeId})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nepali Month</label>
                <Select value={formMonth} onValueChange={setFormMonth} required>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {NEPALI_MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Day (1-31)</label>
                <Input 
                  type="number" min="1" max="31" required 
                  value={formDay} onChange={(e) => setFormDay(e.target.value)}
                  placeholder="e.g. 15" className="rounded-xl" 
                />
              </div>
              <Button type="submit" className="w-full rounded-xl mt-6" disabled={createLeave.isPending}>
                {createLeave.isPending ? "Saving..." : "Save Leave Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 shrink-0">
          {Array.from({ length: 103 }, (_, i) => 2080 + i).map(year => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              className={cn(
                "rounded-lg text-sm transition-all",
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
          <Info className="w-4 h-4" /> Double click any day to view or add multiple employee leaves.
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const dayLeaves = leavesByDay.get(day) || [];
            
            return (
              <div 
                key={day}
                onDoubleClick={() => setMultiSelectDay(day)}
                className={cn(
                  "border rounded-xl p-3 h-32 flex flex-col transition-all cursor-pointer",
                  dayLeaves.length > 0 
                    ? "bg-primary/5 border-primary/20 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5" 
                    : "bg-background border-border/50 hover:bg-muted/50"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "font-display font-bold text-lg",
                    dayLeaves.length > 0 ? "text-primary" : "text-muted-foreground"
                  )}>{day}</span>
                  {dayLeaves.length > 0 && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {dayLeaves.length}
                    </span>
                  )}
                </div>
                
                <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                  {dayLeaves.map(leave => {
                    const emp = getEmployee(leave.employeeId);
                    if (!emp) return null;
                    return (
                      <div 
                        key={leave.id} 
                        className="text-[11px] font-medium px-2 py-1 bg-background text-foreground border border-border/50 rounded-lg truncate shadow-sm flex items-center gap-1.5"
                      >
                        <User className="w-3 h-3 text-primary shrink-0" />
                        {emp.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
