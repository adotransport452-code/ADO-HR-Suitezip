import { useState } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance, useSetAttendance, useDeleteAttendance } from "@/hooks/use-attendance";
import { NEPALI_MONTHS } from "@/lib/constants";
import { getCurrentNepaliDate, getDaysInNepaliMonth } from "@/lib/nepaliDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Plus, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "half_day";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  half_day: "bg-amber-100 text-amber-700"
};
const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present", absent: "Absent", half_day: "Half Day"
};

export default function Attendance() {
  const today = getCurrentNepaliDate();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [selectedDay, setSelectedDay] = useState(today.day);
  const [filterDept, setFilterDept] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  // Multi-select state
  const [selectedEmps, setSelectedEmps] = useState<Set<number>>(new Set());
  const [formStatus, setFormStatus] = useState<AttendanceStatus>("present");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const setAttendanceMutation = useSetAttendance();
  const deleteAttendance = useDeleteAttendance();

  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);

  const dayRecords = attendance?.filter(
    r => r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth && r.day === selectedDay
  ) || [];

  const filteredRecords = dayRecords.filter(r => {
    const emp = employees?.find(e => e.id === r.employeeId);
    if (filterDept !== "all" && emp?.department !== filterDept) return false;
    return true;
  });

  const totalPresent = dayRecords.filter(r => r.status === "present").length;
  const totalAbsent = dayRecords.filter(r => r.status === "absent").length;
  const totalHalfDay = dayRecords.filter(r => r.status === "half_day").length;

  const departments = [...new Set(employees?.map(e => e.department) ?? [])];

  const alreadyMarked = (empId: number) => dayRecords.some(r => r.employeeId === empId);

  const toggleEmployee = (empId: number) => {
    if (alreadyMarked(empId)) return;
    setSelectedEmps(prev => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId); else next.add(empId);
      return next;
    });
  };

  const selectAll = () => {
    const unmarked = employees?.filter(e => !alreadyMarked(e.id)).map(e => e.id) ?? [];
    setSelectedEmps(new Set(unmarked));
  };

  const clearAll = () => setSelectedEmps(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmps.size === 0) return;
    let saved = 0;
    selectedEmps.forEach(empId => {
      setAttendanceMutation.mutate({
        employeeId: empId,
        nepaliYear: selectedYear,
        nepaliMonth: selectedMonth,
        day: selectedDay,
        status: formStatus,
        checkInTime: formCheckIn || null,
        checkOutTime: formCheckOut || null,
        remarks: formRemarks || null
      }, {
        onSuccess: () => {
          saved++;
          if (saved === selectedEmps.size) {
            setAddOpen(false);
            setSelectedEmps(new Set());
            setFormStatus("present");
            setFormCheckIn(""); setFormCheckOut(""); setFormRemarks("");
          }
        }
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {today.dayOfWeek}, {today.day} {NEPALI_MONTHS.find(m => m.value === today.month)?.label} {today.year} B.S.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Mark Attendance
        </Button>
      </div>

      {/* Filters */}
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
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Day</label>
          <Select value={selectedDay.toString()} onValueChange={v => setSelectedDay(Number(v))}>
            <SelectTrigger className="w-20 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Department</label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
          <div><p className="text-xs text-emerald-600 font-medium">Present</p><p className="text-2xl font-bold text-emerald-700">{totalPresent}</p></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-500" />
          <div><p className="text-xs text-red-600 font-medium">Absent</p><p className="text-2xl font-bold text-red-700">{totalAbsent}</p></div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-amber-500" />
          <div><p className="text-xs text-amber-600 font-medium">Half Day</p><p className="text-2xl font-bold text-amber-700">{totalHalfDay}</p></div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold">Designation</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Check-In</TableHead>
                <TableHead className="font-semibold">Check-Out</TableHead>
                <TableHead className="font-semibold">Remarks</TableHead>
                <TableHead className="text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mb-2 mx-auto text-muted" />
                  No attendance records for this day.
                </TableCell></TableRow>
              ) : filteredRecords.map(rec => {
                const emp = employees?.find(e => e.id === rec.employeeId);
                return (
                  <TableRow key={rec.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold">{emp?.name ?? "Unknown"}<br /><span className="text-xs font-mono text-muted-foreground">{emp?.employeeId}</span></TableCell>
                    <TableCell className="text-sm">{emp?.designation}</TableCell>
                    <TableCell className="text-sm">{emp?.department}</TableCell>
                    <TableCell>
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold", STATUS_COLORS[rec.status as AttendanceStatus])}>
                        {STATUS_LABEL[rec.status as AttendanceStatus]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{rec.checkInTime || "—"}</TableCell>
                    <TableCell className="text-sm">{rec.checkOutTime || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rec.remarks || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Delete this record?")) deleteAttendance.mutate(rec.id); }}>
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

      {/* Mark Attendance Dialog - Multi-Select */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setSelectedEmps(new Set()); } }}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Mark Attendance</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Day {selectedDay} · {NEPALI_MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear} B.S.
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2 overflow-hidden">

            {/* Status Selector */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-sm font-semibold">Attendance Status *</label>
              <div className="flex gap-2">
                {(["present", "absent", "half_day"] as AttendanceStatus[]).map(s => (
                  <button type="button" key={s} onClick={() => setFormStatus(s)}
                    className={cn("flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-all",
                      formStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted")}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Time & Remarks */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-In Time</label>
                <Input type="time" value={formCheckIn} onChange={e => setFormCheckIn(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-Out Time</label>
                <Input type="time" value={formCheckOut} onChange={e => setFormCheckOut(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5 shrink-0">
              <label className="text-sm font-semibold">Remarks</label>
              <Input placeholder="Optional..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="rounded-xl" />
            </div>

            {/* Employee Multi-Select */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Select Employees ({selectedEmps.size} selected)</label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
                  <span className="text-muted-foreground">·</span>
                  <button type="button" onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Clear</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 max-h-64 pr-1">
              {employees?.map(emp => {
                const marked = alreadyMarked(emp.id);
                const markedRecord = dayRecords.find(r => r.employeeId === emp.id);
                const isSelected = selectedEmps.has(emp.id);
                return (
                  <label key={emp.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
                      marked
                        ? "bg-muted/40 border-border/40 opacity-70 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary/10 border-primary/40"
                        : "bg-card border-border/50 hover:bg-muted/20"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={marked}
                      onCheckedChange={() => toggleEmployee(emp.id)}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.designation} · {emp.department}</div>
                    </div>
                    {marked && markedRecord && (
                      <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold shrink-0", STATUS_COLORS[markedRecord.status as AttendanceStatus])}>
                        {STATUS_LABEL[markedRecord.status as AttendanceStatus]}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <Button type="submit" className="w-full rounded-xl shrink-0" disabled={selectedEmps.size === 0 || setAttendanceMutation.isPending}>
              {setAttendanceMutation.isPending ? "Saving..." : `Mark ${selectedEmps.size} Employee${selectedEmps.size !== 1 ? "s" : ""}`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
