import { useState, useEffect } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance, useSetAttendance, useDeleteAttendance } from "@/hooks/use-attendance";
import { NEPALI_MONTHS } from "@/lib/constants";
import { getCurrentNepaliDate, getDaysInNepaliMonth } from "@/lib/nepaliDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Plus, Trash2, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
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
  const [filterEmp, setFilterEmp] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const [formEmpId, setFormEmpId] = useState("");
  const [formStatus, setFormStatus] = useState<AttendanceStatus>("present");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const setAttendance = useSetAttendance();
  const deleteAttendance = useDeleteAttendance();

  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);

  const dayRecords = attendance?.filter(
    r => r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth && r.day === selectedDay
  ) || [];

  const filteredRecords = dayRecords.filter(r => {
    const emp = employees?.find(e => e.id === r.employeeId);
    if (filterEmp !== "all" && r.employeeId !== Number(filterEmp)) return false;
    if (filterDept !== "all" && emp?.department !== filterDept) return false;
    return true;
  });

  const totalPresent = dayRecords.filter(r => r.status === "present").length;
  const totalAbsent = dayRecords.filter(r => r.status === "absent").length;
  const totalHalfDay = dayRecords.filter(r => r.status === "half_day").length;

  const departments = [...new Set(employees?.map(e => e.department) ?? [])];

  const selectedEmp = employees?.find(e => e.id === Number(formEmpId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) return;
    setAttendance.mutate({
      employeeId: Number(formEmpId),
      nepaliYear: selectedYear,
      nepaliMonth: selectedMonth,
      day: selectedDay,
      status: formStatus,
      checkInTime: formCheckIn || null,
      checkOutTime: formCheckOut || null,
      remarks: formRemarks || null
    }, {
      onSuccess: () => {
        setAddOpen(false);
        setFormEmpId(""); setFormStatus("present");
        setFormCheckIn(""); setFormCheckOut(""); setFormRemarks("");
      }
    });
  };

  const alreadyMarked = (empId: string) =>
    dayRecords.some(r => r.employeeId === Number(empId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track daily employee attendance with check-in/out times.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Mark Attendance
        </Button>
      </div>

      {/* Year/Month/Day Selector */}
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
            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
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
                  No attendance records for this day. Mark attendance to begin.
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

      {/* Mark Attendance Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Mark Attendance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Employee *</label>
              <Select value={formEmpId} onValueChange={setFormEmpId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees?.map(e => (
                    <SelectItem key={e.id} value={e.id.toString()} disabled={alreadyMarked(e.id.toString())}>
                      {e.name} ({e.employeeId}) {alreadyMarked(e.id.toString()) ? "✓" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEmp && (
              <div className="flex gap-2 p-3 bg-muted/50 rounded-xl text-sm">
                <span className="text-muted-foreground">{selectedEmp.designation}</span>
                <span>•</span>
                <span className="text-muted-foreground">{selectedEmp.department}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Status *</label>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-In Time</label>
                <Input type="time" value={formCheckIn} onChange={e => setFormCheckIn(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-Out Time</label>
                <Input type="time" value={formCheckOut} onChange={e => setFormCheckOut(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Remarks</label>
              <Input placeholder="Optional remarks..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={!formEmpId || setAttendance.isPending}>
              {setAttendance.isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
