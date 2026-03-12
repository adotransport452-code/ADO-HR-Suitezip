import { useState, useEffect } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useOvertime, useCreateOvertime, useDeleteOvertime } from "@/hooks/use-overtime";
import { NEPALI_MONTHS } from "@/lib/constants";
import { getCurrentNepaliDate, getDaysInNepaliMonth } from "@/lib/nepaliDate";
import { getMonthCalendar } from "@/lib/calendarUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Plus, Trash2, Settings, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_OT_NAMES = [
  "Hari Chaudhary", "Mahesh Chaudhary", "Rakesh Dangura Tharu",
  "Keshab D Tharu", "Nikesh Bishwakarma", "Birendra Rawat",
  "Ishwor Shrestha", "Ashish Thapa", "Pawan Gurung",
  "prakash Baram", "Jiban Kumar Magar"
];

const OT_STORAGE_KEY = "ot_employee_ids";

export default function Overtime() {
  const today = getCurrentNepaliDate();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const [formEmpId, setFormEmpId] = useState("");
  const [formDay, setFormDay] = useState("");
  const [formHours, setFormHours] = useState("");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const { data: employees } = useEmployees();
  const { data: overtimeData } = useOvertime();
  const createOvertime = useCreateOvertime();
  const deleteOvertime = useDeleteOvertime();

  const calendarDays = getMonthCalendar(selectedYear, selectedMonth);
  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);

  // OT employee IDs stored in localStorage
  const [otEmpIds, setOtEmpIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!employees) return;
    const saved = localStorage.getItem(OT_STORAGE_KEY);
    if (saved) {
      setOtEmpIds(new Set(JSON.parse(saved)));
    } else {
      // Auto-detect by name matching
      const matched = employees
        .filter(e => DEFAULT_OT_NAMES.some(n => n.toLowerCase() === e.name.toLowerCase() || e.name.toLowerCase().includes(n.toLowerCase().split(" ")[0])))
        .map(e => e.id);
      setOtEmpIds(new Set(matched));
    }
  }, [employees]);

  const saveOtEmpIds = (ids: Set<number>) => {
    setOtEmpIds(ids);
    localStorage.setItem(OT_STORAGE_KEY, JSON.stringify([...ids]));
  };

  const otEmployees = employees?.filter(e => otEmpIds.has(e.id)) ?? [];

  const monthRecords = overtimeData?.filter(
    r => r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth
  ) || [];

  const totalHours = monthRecords.reduce((sum, r) => sum + parseFloat(r.overtimeHours || "0"), 0);

  const getDayOfWeek = (day: number) => {
    const found = calendarDays.find(d => d.day === day && d.isCurrentMonth);
    return found?.dayOfWeek ?? "";
  };

  // Only Saturday days
  const saturdayDays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => getDayOfWeek(d) === "Sat");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId || !formDay || !formHours) return;
    createOvertime.mutate({
      employeeId: Number(formEmpId),
      nepaliYear: selectedYear,
      nepaliMonth: selectedMonth,
      day: Number(formDay),
      overtimeHours: formHours,
      checkInTime: formCheckIn || null,
      checkOutTime: formCheckOut || null,
      remarks: formRemarks || null
    }, {
      onSuccess: () => {
        setAddOpen(false);
        setFormEmpId(""); setFormDay(""); setFormHours("");
        setFormCheckIn(""); setFormCheckOut(""); setFormRemarks("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Overtime Records</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {today.dayOfWeek}, {today.day} {NEPALI_MONTHS.find(m => m.value === today.month)?.label} {today.year} B.S. · Saturday overtime only
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setManageOpen(true)} className="rounded-xl">
            <Settings className="w-4 h-4 mr-2" /> Manage Employees
          </Button>
          <Button onClick={() => setAddOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Overtime
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Year</label>
          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 103 }, (_, i) => 2080 + i).map(y => <SelectItem key={y} value={y.toString()}>{y} B.S.</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Month</label>
          <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{NEPALI_MONTHS.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* OT Employee Cards */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Overtime Eligible Employees ({otEmployees.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {otEmployees.map(emp => {
            const empTotal = monthRecords.filter(r => r.employeeId === emp.id).reduce((s, r) => s + parseFloat(r.overtimeHours || "0"), 0);
            return (
              <div key={emp.id} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl border border-border/50">
                <span className="font-medium text-sm">{emp.name}</span>
                {empTotal > 0 && <span className="text-xs text-primary font-bold">{empTotal}h</span>}
              </div>
            );
          })}
          {otEmployees.length === 0 && (
            <p className="text-sm text-muted-foreground">No overtime employees configured. Click "Manage Employees" to add.</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total OT Hours (Month)</p>
            <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)} hrs</p>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-3">
          <Clock className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Saturdays This Month</p>
            <p className="text-2xl font-bold text-foreground">{saturdayDays.length}</p>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b font-semibold text-foreground">Monthly Overtime — {NEPALI_MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Day (Saturday)</TableHead>
                <TableHead className="font-semibold">OT Hours</TableHead>
                <TableHead className="font-semibold">Check-In</TableHead>
                <TableHead className="font-semibold">Check-Out</TableHead>
                <TableHead className="font-semibold">Remarks</TableHead>
                <TableHead className="text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthRecords.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mb-2 mx-auto text-muted" />
                  No overtime records this month.
                </TableCell></TableRow>
              ) : monthRecords.map(rec => {
                const emp = employees?.find(e => e.id === rec.employeeId);
                return (
                  <TableRow key={rec.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold">{emp?.name ?? "Unknown"}<br /><span className="text-xs font-mono text-muted-foreground">{emp?.employeeId}</span></TableCell>
                    <TableCell className="text-sm">{emp?.department}</TableCell>
                    <TableCell className="text-sm font-medium">Day {rec.day} <span className="text-xs text-muted-foreground">({getDayOfWeek(rec.day)})</span></TableCell>
                    <TableCell><span className="font-bold text-primary">{rec.overtimeHours} hrs</span></TableCell>
                    <TableCell className="text-sm">{rec.checkInTime || "—"}</TableCell>
                    <TableCell className="text-sm">{rec.checkOutTime || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rec.remarks || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Delete this record?")) deleteOvertime.mutate(rec.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Overtime Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Record Overtime</DialogTitle>
            <p className="text-sm text-muted-foreground">Only Saturday dates are available for overtime.</p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Employee *</label>
              <Select value={formEmpId} onValueChange={setFormEmpId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {otEmployees.length > 0 ? otEmployees.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name} ({e.employeeId})</SelectItem>)
                    : employees?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name} ({e.employeeId})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Saturday * <span className="text-xs text-muted-foreground font-normal">({saturdayDays.length} available)</span></label>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick Saturday..." /></SelectTrigger>
                  <SelectContent>
                    {saturdayDays.length === 0
                      ? <SelectItem value="-" disabled>No Saturdays this month</SelectItem>
                      : saturdayDays.map(d => <SelectItem key={d} value={d.toString()}>Day {d} (Saturday)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">OT Hours *</label>
                <Input type="number" step="0.5" min="0" max="24" placeholder="e.g. 4" value={formHours} onChange={e => setFormHours(e.target.value)} className="rounded-xl" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-In</label>
                <Input type="time" value={formCheckIn} onChange={e => setFormCheckIn(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-Out</label>
                <Input type="time" value={formCheckOut} onChange={e => setFormCheckOut(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Remarks</label>
              <Input placeholder="Optional..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={!formEmpId || !formDay || !formHours || createOvertime.isPending}>
              {createOvertime.isPending ? "Saving..." : "Save Overtime"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage OT Employees Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display flex items-center gap-2"><UserPlus className="w-6 h-6 text-primary" /> Manage Overtime Employees</DialogTitle>
            <p className="text-sm text-muted-foreground">Check/uncheck employees who are eligible for overtime.</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1.5 py-2">
            {employees?.map(emp => {
              const isOT = otEmpIds.has(emp.id);
              return (
                <label key={emp.id}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    isOT ? "bg-primary/10 border-primary/30" : "bg-card border-border/50 hover:bg-muted/20")}>
                  <Checkbox checked={isOT} onCheckedChange={(checked) => {
                    const next = new Set(otEmpIds);
                    if (checked) next.add(emp.id); else next.delete(emp.id);
                    saveOtEmpIds(next);
                  }} />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.designation} · {emp.department}</div>
                  </div>
                  {isOT && <span className="text-xs text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-md">OT Eligible</span>}
                </label>
              );
            })}
          </div>
          <div className="pt-2 border-t">
            <Button className="w-full rounded-xl" onClick={() => setManageOpen(false)}>Done ({otEmpIds.size} selected)</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
