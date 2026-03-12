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
import { Clock, Plus, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Overtime() {
  const today = getCurrentNepaliDate();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [addOpen, setAddOpen] = useState(false);

  const [formEmpId, setFormEmpId] = useState("");
  const [formDay, setFormDay] = useState("");
  const [formHours, setFormHours] = useState("");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [dayWarning, setDayWarning] = useState("");

  const { data: employees } = useEmployees();
  const { data: overtimeData } = useOvertime();
  const createOvertime = useCreateOvertime();
  const deleteOvertime = useDeleteOvertime();

  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);
  const calendarDays = getMonthCalendar(selectedYear, selectedMonth);

  const monthRecords = overtimeData?.filter(
    r => r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth
  ) || [];

  const totalHours = monthRecords.reduce((sum, r) => sum + parseFloat(r.overtimeHours || "0"), 0);

  const empTotals = employees?.map(emp => {
    const empRecords = monthRecords.filter(r => r.employeeId === emp.id);
    const total = empRecords.reduce((sum, r) => sum + parseFloat(r.overtimeHours || "0"), 0);
    return { emp, records: empRecords, total };
  }).filter(x => x.records.length > 0) ?? [];

  const getDayOfWeek = (day: number) => {
    const found = calendarDays.find(d => d.day === day && d.isCurrentMonth);
    return found?.dayOfWeek ?? "";
  };

  const isSaturday = (day: number) => getDayOfWeek(day) === "Sat";

  const handleDayChange = (val: string) => {
    setFormDay(val);
    if (val) {
      const dayNum = Number(val);
      if (!isSaturday(dayNum)) {
        setDayWarning(`Day ${val} is a ${getDayOfWeek(dayNum)}, not a Saturday. Overtime is only recorded on Saturdays.`);
      } else {
        setDayWarning("");
      }
    } else {
      setDayWarning("");
    }
  };

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
        setFormCheckIn(""); setFormCheckOut(""); setFormRemarks(""); setDayWarning("");
      }
    });
  };

  const selectedEmp = employees?.find(e => e.id === Number(formEmpId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Overtime Records</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track Saturday overtime hours per employee.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Overtime
        </Button>
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

      {/* Summary Card */}
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
            <p className="text-xs text-muted-foreground font-medium">Employees with OT</p>
            <p className="text-2xl font-bold text-foreground">{empTotals.length}</p>
          </div>
        </div>
      </div>

      {/* Per-Employee Table */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b font-semibold text-foreground">Monthly Overtime Summary</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Day</TableHead>
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Record Overtime</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Employee *</label>
              <Select value={formEmpId} onValueChange={setFormEmpId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>{employees?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name} ({e.employeeId})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedEmp && <div className="flex gap-2 p-3 bg-muted/50 rounded-xl text-sm"><span className="text-muted-foreground">{selectedEmp.designation} • {selectedEmp.department}</span></div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Day *</label>
                <Select value={formDay} onValueChange={handleDayChange}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Day..." /></SelectTrigger>
                  <SelectContent>{Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>Day {d} ({getDayOfWeek(d)})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">OT Hours *</label>
                <Input type="number" step="0.5" min="0" max="24" placeholder="e.g. 4" value={formHours} onChange={e => setFormHours(e.target.value)} className="rounded-xl" required />
              </div>
            </div>
            {dayWarning && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{dayWarning}
              </div>
            )}
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
              <Input placeholder="Optional remarks..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={!formEmpId || !formDay || !formHours || createOvertime.isPending}>
              {createOvertime.isPending ? "Saving..." : "Save Overtime"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
