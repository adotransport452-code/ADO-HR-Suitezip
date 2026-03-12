import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useEmployees } from "@/hooks/use-employees";
import { useOvertime, useUpdateOvertime, useDeleteOvertime } from "@/hooks/use-overtime";
import { NEPALI_MONTHS } from "@/lib/constants";
import { getActiveNepaliDate } from "@/lib/dateStore";
import { getDaysInNepaliMonth } from "@/lib/nepaliDate";
import { getMonthCalendar } from "@/lib/calendarUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, Pencil, Check, X, Trash2, Building2, User, Briefcase, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Overtime } from "@shared/schema";

export default function OvertimeEmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const today = getActiveNepaliDate();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ overtimeHours: string; checkInTime: string; checkOutTime: string; remarks: string }>({
    overtimeHours: "", checkInTime: "", checkOutTime: "", remarks: ""
  });

  const { data: employees } = useEmployees();
  const { data: overtimeData } = useOvertime();
  const updateOvertime = useUpdateOvertime();
  const deleteOvertime = useDeleteOvertime();

  const empId = Number(id);
  const employee = employees?.find(e => e.id === empId);
  const calendarDays = getMonthCalendar(selectedYear, selectedMonth);
  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);

  const empRecords = overtimeData?.filter(
    r => r.employeeId === empId && r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth
  ) ?? [];

  const totalHours = empRecords.reduce((sum, r) => sum + parseFloat(r.overtimeHours || "0"), 0);

  const getDayOfWeek = (day: number) => calendarDays.find(d => d.day === day && d.isCurrentMonth)?.dayOfWeek ?? "";

  const startEdit = (rec: Overtime) => {
    setEditingId(rec.id);
    setEditFields({
      overtimeHours: rec.overtimeHours || "",
      checkInTime: rec.checkInTime || "",
      checkOutTime: rec.checkOutTime || "",
      remarks: rec.remarks || ""
    });
  };

  const saveEdit = (id: number) => {
    updateOvertime.mutate({ id, data: {
      overtimeHours: editFields.overtimeHours || null,
      checkInTime: editFields.checkInTime || null,
      checkOutTime: editFields.checkOutTime || null,
      remarks: editFields.remarks || null
    }}, { onSuccess: () => setEditingId(null) });
  };

  const monthName = NEPALI_MONTHS.find(m => m.value === selectedMonth)?.label ?? "";

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <p>Employee not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate("/overtime")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Overtime
      </button>

      {/* Employee Info Card — Top Center */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
          {employee.name.charAt(0)}
        </div>
        <h1 className="text-2xl font-display font-bold">{employee.name}</h1>
        <div className="mt-3 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-1.5 bg-primary-foreground/15 px-3 py-1.5 rounded-xl">
            <Hash className="w-3.5 h-3.5" />
            <span>{employee.employeeId}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary-foreground/15 px-3 py-1.5 rounded-xl">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{employee.designation}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary-foreground/15 px-3 py-1.5 rounded-xl">
            <Building2 className="w-3.5 h-3.5" />
            <span>{employee.department}</span>
          </div>
        </div>
      </div>

      {/* Month/Year Selector */}
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
        <div className="flex items-center gap-2 ml-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{totalHours.toFixed(1)} hrs total</span>
          </div>
        </div>
      </div>

      {/* OT Records Table */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Overtime Records — {monthName} {selectedYear}
          <span className="ml-auto text-xs text-muted-foreground font-normal">{empRecords.length} record{empRecords.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Day</TableHead>
                <TableHead className="font-semibold">OT Hours</TableHead>
                <TableHead className="font-semibold">Check-In</TableHead>
                <TableHead className="font-semibold">Check-Out</TableHead>
                <TableHead className="font-semibold">Remarks</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empRecords.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Clock className="w-10 h-10 mb-2 mx-auto text-muted" />
                  No overtime records for {monthName} {selectedYear}.
                </TableCell></TableRow>
              ) : empRecords.map(rec => {
                const isEditing = editingId === rec.id;
                return (
                  <TableRow key={rec.id} className={cn("transition-colors", isEditing ? "bg-primary/5" : "hover:bg-muted/20")}>
                    <TableCell className="font-medium whitespace-nowrap">
                      Day {rec.day} <span className="text-xs text-muted-foreground">({getDayOfWeek(rec.day)})</span>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" step="0.5" min="0" max="24" value={editFields.overtimeHours}
                          onChange={e => setEditFields(f => ({ ...f, overtimeHours: e.target.value }))}
                          className="w-24 h-8 rounded-lg text-sm" />
                      ) : (
                        <span className="font-bold text-primary">{rec.overtimeHours} hrs</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="time" value={editFields.checkInTime}
                          onChange={e => setEditFields(f => ({ ...f, checkInTime: e.target.value }))}
                          className="w-32 h-8 rounded-lg text-sm" />
                      ) : (
                        <span className="text-sm">{rec.checkInTime || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="time" value={editFields.checkOutTime}
                          onChange={e => setEditFields(f => ({ ...f, checkOutTime: e.target.value }))}
                          className="w-32 h-8 rounded-lg text-sm" />
                      ) : (
                        <span className="text-sm">{rec.checkOutTime || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={editFields.remarks} placeholder="Remarks..."
                          onChange={e => setEditFields(f => ({ ...f, remarks: e.target.value }))}
                          className="w-40 h-8 rounded-lg text-sm" />
                      ) : (
                        <span className="text-sm text-muted-foreground">{rec.remarks || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => saveEdit(rec.id)} disabled={updateOvertime.isPending}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"
                            onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-blue-500 hover:bg-blue-50"
                            onClick={() => startEdit(rec)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm("Delete this record?")) deleteOvertime.mutate(rec.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {empRecords.length > 0 && (
                <TableRow className="bg-muted/30 font-bold border-t-2">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="font-bold text-primary">{totalHours.toFixed(1)} hrs</TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
