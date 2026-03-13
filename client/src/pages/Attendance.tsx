import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance, useSetAttendance, useDeleteAttendance } from "@/hooks/use-attendance";
import { NEPALI_MONTHS } from "@/lib/constants";
import { useActiveDate } from "@/hooks/use-active-date";
import { getDaysInNepaliMonth, getMonthStartDayOfWeek } from "@/lib/nepaliDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Download, Upload, MousePointer2, Check, X, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@shared/schema";

type AttendanceStatus = "present" | "absent" | "half_day";

const STATUS_SHORT: Record<AttendanceStatus, string> = { present: "P", absent: "A", half_day: "H" };
const STATUS_LABEL: Record<AttendanceStatus, string> = { present: "Present", absent: "Absent", half_day: "Half Day" };
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500 text-white",
  absent: "bg-red-500 text-white",
  half_day: "bg-amber-400 text-white"
};
const STATUS_HOVER: Record<AttendanceStatus, string> = {
  present: "hover:bg-emerald-50 hover:text-emerald-700",
  absent: "hover:bg-red-50 hover:text-red-700",
  half_day: "hover:bg-amber-50 hover:text-amber-700"
};

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function Attendance() {
  const today = useActiveDate();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [filterDept, setFilterDept] = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Cell dialog state
  const [cellDialog, setCellDialog] = useState<{ emp: Employee; day: number } | null>(null);
  const [cellStatus, setCellStatus] = useState<AttendanceStatus>("present");
  const [cellCheckIn, setCellCheckIn] = useState("");
  const [cellCheckOut, setCellCheckOut] = useState("");
  const [cellRemarks, setCellRemarks] = useState("");

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<Array<{ empId: number; empName: string; day: number; status: AttendanceStatus }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const setAttendanceMutation = useSetAttendance();
  const deleteAttendanceMutation = useDeleteAttendance();

  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);
  const startDow = getMonthStartDayOfWeek(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = NEPALI_MONTHS.find(m => m.value === selectedMonth)?.label ?? "";

  const departments = [...new Set(employees?.map(e => e.department).filter(Boolean) ?? [])];
  const filteredEmployees = employees?.filter(e =>
    filterDept === "all" || e.department === filterDept
  ) ?? [];

  const getRecord = (empId: number, day: number) =>
    attendance?.find(r => r.employeeId === empId && r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth && r.day === day);

  const getEmpTotals = (empId: number) => {
    const recs = attendance?.filter(r => r.employeeId === empId && r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth) ?? [];
    const present = recs.filter(r => r.status === "present").length;
    const half = recs.filter(r => r.status === "half_day").length;
    const absent = recs.filter(r => r.status === "absent").length;
    return { present: present + half / 2, absent };
  };

  const openCellDialog = (emp: Employee, day: number) => {
    const rec = getRecord(emp.id, day);
    setCellStatus((rec?.status as AttendanceStatus) ?? "present");
    setCellCheckIn(rec?.checkInTime ?? "");
    setCellCheckOut(rec?.checkOutTime ?? "");
    setCellRemarks(rec?.remarks ?? "");
    setCellDialog({ emp, day });
  };

  const saveCellAttendance = () => {
    if (!cellDialog) return;
    setAttendanceMutation.mutate({
      employeeId: cellDialog.emp.id,
      nepaliYear: selectedYear,
      nepaliMonth: selectedMonth,
      day: cellDialog.day,
      status: cellStatus,
      checkInTime: cellCheckIn || null,
      checkOutTime: cellCheckOut || null,
      remarks: cellRemarks || null
    }, {
      onSuccess: () => {
        setCellDialog(null);
        setCellCheckIn(""); setCellCheckOut(""); setCellRemarks("");
      }
    });
  };

  const deleteCell = () => {
    if (!cellDialog) return;
    const rec = getRecord(cellDialog.emp.id, cellDialog.day);
    if (rec) { deleteAttendanceMutation.mutate(rec.id, { onSuccess: () => setCellDialog(null) }); }
    else setCellDialog(null);
  };

  const toggleRow = (empId: number) => {
    setSelectedRows(prev => { const n = new Set(prev); if (n.has(empId)) n.delete(empId); else n.add(empId); return n; });
  };

  // Export attendance to Excel
  const exportAttendance = () => {
    const rows = filteredEmployees.map(emp => {
      const row: Record<string, any> = {
        "Employee ID": emp.employeeId, "Name": emp.name, "Designation": emp.designation, "Department": emp.department
      };
      days.forEach(d => {
        const rec = getRecord(emp.id, d);
        row[`Day ${d}`] = rec ? STATUS_SHORT[rec.status as AttendanceStatus] : "";
      });
      const totals = getEmpTotals(emp.id);
      row["Total Present"] = totals.present;
      row["Total Absent"] = totals.absent;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${monthName}_${selectedYear}.xlsx`);
    toast({ title: "Exported", description: `Attendance for ${monthName} ${selectedYear} downloaded.` });
  };

  // Parse import text (tab/comma separated: Name, Day1Status, Day2Status, ...)
  const parseImportText = (text: string) => {
    if (!text.trim() || !employees) return;
    const lines = text.trim().split("\n").filter(l => l.trim());
    const results: typeof importPreview = [];
    lines.forEach(line => {
      const cols = line.split(/\t|,/).map(c => c.trim());
      if (cols.length < 2) return;
      const nameOrId = cols[0];
      const emp = employees.find(e =>
        e.name.toLowerCase() === nameOrId.toLowerCase() ||
        e.employeeId.toLowerCase() === nameOrId.toLowerCase()
      );
      if (!emp) return;
      cols.slice(1).forEach((val, idx) => {
        const day = idx + 1;
        if (day > daysInMonth) return;
        const v = val.toUpperCase();
        let status: AttendanceStatus | null = null;
        if (v === "P" || v === "PRESENT") status = "present";
        else if (v === "A" || v === "ABSENT") status = "absent";
        else if (v === "H" || v === "HALF" || v === "HALF DAY") status = "half_day";
        if (status) results.push({ empId: emp.id, empName: emp.name, day, status });
      });
    });
    setImportPreview(results);
    if (results.length === 0) toast({ title: "No matches found", description: "Ensure employee names/IDs match exactly.", variant: "destructive" });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employees) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!json.length) return;
      const results: typeof importPreview = [];
      json.slice(1).forEach((row) => {
        if (!row[0]) return;
        const nameOrId = String(row[0]);
        const emp = employees.find(e =>
          e.name.toLowerCase() === nameOrId.toLowerCase() ||
          e.employeeId.toLowerCase() === nameOrId.toLowerCase()
        );
        if (!emp) return;
        row.slice(1).forEach((val, idx) => {
          const day = idx + 1;
          if (day > daysInMonth || !val) return;
          const v = String(val).toUpperCase().trim();
          let status: AttendanceStatus | null = null;
          if (v === "P" || v === "PRESENT") status = "present";
          else if (v === "A" || v === "ABSENT") status = "absent";
          else if (v === "H" || v === "HALF" || v === "HALF DAY") status = "half_day";
          if (status) results.push({ empId: emp.id, empName: emp.name, day, status });
        });
      });
      setImportPreview(results);
      if (results.length === 0) toast({ title: "No data found", description: "Check file format. Columns: Name, Day1, Day2...", variant: "destructive" });
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = () => {
    importPreview.forEach(({ empId, day, status }) => {
      setAttendanceMutation.mutate({
        employeeId: empId, nepaliYear: selectedYear, nepaliMonth: selectedMonth,
        day, status, checkInTime: null, checkOutTime: null, remarks: "Imported"
      });
    });
    setImportOpen(false);
    setImportPreview([]);
    setImportText("");
    toast({ title: "Import complete", description: `${importPreview.length} attendance records saved.` });
  };

  // Column day-of-week header
  const getDayDow = (day: number) => DAY_LABELS[(startDow + day - 1) % 7];
  const isSaturday = (day: number) => getDayDow(day) === "Sat";
  const isSunday = (day: number) => getDayDow(day) === "Sun";

  // Summary
  const totalPresent = attendance?.filter(r => r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth && r.status === "present").length ?? 0;
  const totalAbsent = attendance?.filter(r => r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth && r.status === "absent").length ?? 0;
  const totalHalf = attendance?.filter(r => r.nepaliYear === selectedYear && r.nepaliMonth === selectedMonth && r.status === "half_day").length ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {`${today.year}-${String(today.month).padStart(2,"0")}-${String(today.day).padStart(2,"0")} (BS)`}
            &nbsp;·&nbsp;{today.dayOfWeek}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className={cn("rounded-xl", selectMode && "bg-primary/10 border-primary text-primary")}
            onClick={() => { setSelectMode(!selectMode); setSelectedRows(new Set()); }}>
            <MousePointer2 className="w-4 h-4 mr-1.5" /> {selectMode ? "Exit Select" : "Select"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setImportPreview([]); setImportText(""); setImportOpen(true); }}>
            <Upload className="w-4 h-4 mr-1.5" /> Import
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={exportAttendance}>
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
        </div>
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

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">P</div>
          <div><p className="text-xs text-emerald-600 font-medium">Present</p><p className="text-xl font-bold text-emerald-700">{totalPresent}</p></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm shrink-0">A</div>
          <div><p className="text-xs text-red-600 font-medium">Absent</p><p className="text-xl font-bold text-red-700">{totalAbsent}</p></div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-white font-bold text-sm shrink-0">H</div>
          <div><p className="text-xs text-amber-600 font-medium">Half Day</p><p className="text-xl font-bold text-amber-700">{totalHalf}</p></div>
        </div>
      </div>

      {/* ATTENDANCE GRID */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-border/30 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Attendance Grid — {monthName} {selectedYear} B.S.</span>
          <span className="text-xs text-muted-foreground ml-auto">Click any cell to mark attendance</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: `${200 + daysInMonth * 36 + 100}px` }}>
            <thead>
              {/* Day-of-week row */}
              <tr className="bg-muted/40 border-b border-border/30">
                {selectMode && <th className="w-8 border-r border-border/20" />}
                <th className="text-left px-3 py-2 font-bold text-foreground border-r border-border/20 min-w-[160px]">Employee</th>
                {days.map(d => (
                  <th key={d} className={cn("w-9 text-center py-1 border-r border-border/10 font-medium",
                    isSaturday(d) ? "bg-purple-50 text-purple-600" : isSunday(d) ? "bg-red-50 text-red-500" : "text-muted-foreground")}>
                    {getDayDow(d).slice(0,2)}
                  </th>
                ))}
                <th className="text-center px-2 py-2 bg-emerald-50 text-emerald-700 font-bold border-r border-border/20 min-w-[56px]">Total P</th>
                <th className="text-center px-2 py-2 bg-red-50 text-red-700 font-bold min-w-[56px]">Total A</th>
              </tr>
              {/* Day number row */}
              <tr className="bg-muted/20 border-b border-border/30">
                {selectMode && <th className="border-r border-border/20" />}
                <th className="text-left px-3 py-1 text-xs text-muted-foreground border-r border-border/20 font-medium">Designation / Dept</th>
                {days.map(d => (
                  <th key={d} className={cn("text-center py-1 border-r border-border/10 font-bold",
                    isSaturday(d) ? "bg-purple-50/60 text-purple-600" : isSunday(d) ? "bg-red-50/60 text-red-500" : "text-foreground")}>
                    {d}
                  </th>
                ))}
                <th className="bg-emerald-50/60 border-r border-border/20" />
                <th className="bg-red-50/60" />
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={days.length + (selectMode ? 4 : 3)} className="text-center py-12 text-muted-foreground">No employees found.</td></tr>
              ) : filteredEmployees.map((emp, rowIdx) => {
                const totals = getEmpTotals(emp.id);
                const isSelected = selectedRows.has(emp.id);
                return (
                  <tr key={emp.id} className={cn("border-b border-border/20 hover:bg-muted/10 transition-colors",
                    isSelected && "bg-primary/5", rowIdx % 2 === 1 && "bg-muted/5")}>
                    {selectMode && (
                      <td className="w-8 text-center border-r border-border/20 px-1">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(emp.id)} />
                      </td>
                    )}
                    <td className="px-3 py-2 border-r border-border/20 min-w-[160px]">
                      <div className="font-semibold text-foreground leading-tight">{emp.name}</div>
                      <div className="text-muted-foreground text-[10px] mt-0.5">{emp.designation}</div>
                      <div className="text-muted-foreground text-[10px]">{emp.department}</div>
                    </td>
                    {days.map(d => {
                      const rec = getRecord(emp.id, d);
                      const status = rec?.status as AttendanceStatus | undefined;
                      return (
                        <td key={d} className={cn("w-9 text-center py-1 border-r border-border/10",
                          isSaturday(d) ? "bg-purple-50/30" : isSunday(d) ? "bg-red-50/20" : "")}>
                          <button
                            onClick={() => openCellDialog(emp, d)}
                            className={cn("w-7 h-6 rounded text-[10px] font-bold transition-all",
                              status ? `${STATUS_COLOR[status]} shadow-sm` : `text-muted-foreground/30 hover:bg-muted hover:text-muted-foreground`)}>
                            {status ? STATUS_SHORT[status] : "·"}
                          </button>
                        </td>
                      );
                    })}
                    <td className="text-center py-1 px-2 bg-emerald-50/40 border-r border-border/20 font-bold text-emerald-700">
                      {totals.present > 0 ? totals.present : ""}
                    </td>
                    <td className="text-center py-1 px-2 bg-red-50/40 font-bold text-red-700">
                      {totals.absent > 0 ? totals.absent : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 p-3 border-t border-border/30 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-5 h-4 rounded bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">P</span> Present</span>
          <span className="flex items-center gap-1"><span className="w-5 h-4 rounded bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">A</span> Absent</span>
          <span className="flex items-center gap-1"><span className="w-5 h-4 rounded bg-amber-400 flex items-center justify-center text-white text-[10px] font-bold">H</span> Half Day</span>
          <span className="flex items-center gap-1"><span className="w-5 h-4 rounded bg-purple-100 flex items-center justify-center text-purple-600 text-[10px] font-bold">Sa</span> Saturday</span>
          <span className="ml-auto font-medium text-foreground">Total Present = Present + (Half Days ÷ 2)</span>
        </div>
      </div>

      {/* Cell Attendance Dialog */}
      <Dialog open={!!cellDialog} onOpenChange={v => !v && setCellDialog(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Mark Attendance</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{cellDialog?.emp.name}</span>
              &nbsp;·&nbsp;Day {cellDialog?.day}, {monthName} {selectedYear} B.S.
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Attendance Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(["present", "absent", "half_day"] as AttendanceStatus[]).map(s => (
                  <button key={s} type="button" onClick={() => setCellStatus(s)}
                    className={cn("py-2.5 rounded-xl border text-sm font-medium transition-all",
                      cellStatus === s ? `${STATUS_COLOR[s]} border-transparent shadow-sm` : "border-border bg-card hover:bg-muted")}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-In</label>
                <Input type="time" value={cellCheckIn} onChange={e => setCellCheckIn(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Check-Out</label>
                <Input type="time" value={cellCheckOut} onChange={e => setCellCheckOut(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Remarks</label>
              <Input placeholder="Optional notes..." value={cellRemarks} onChange={e => setCellRemarks(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex gap-2 pt-1">
              {cellDialog && getRecord(cellDialog.emp.id, cellDialog.day) && (
                <Button variant="outline" className="rounded-xl flex-none text-destructive hover:bg-destructive/10 border-destructive/20" onClick={deleteCell}>
                  <X className="w-4 h-4 mr-1" /> Remove
                </Button>
              )}
              <Button className="flex-1 rounded-xl" onClick={saveCellAttendance} disabled={setAttendanceMutation.isPending}>
                <Check className="w-4 h-4 mr-1.5" />
                {setAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Import Attendance</DialogTitle>
            <p className="text-sm text-muted-foreground">Import attendance for {monthName} {selectedYear} B.S.</p>
          </DialogHeader>

          <div className="space-y-5 mt-3">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-primary" /> Import Excel / CSV File
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={handleImportFile} />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload Excel or CSV</p>
                <p className="text-xs text-muted-foreground mt-1">Format: Name | Day1 | Day2 | ... (use P, A, H)</p>
              </div>
            </div>

            {/* Paste Text */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Paste Excel Data</label>
              <textarea
                className="w-full h-28 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={"Hari Chaudhary\tP\tA\tP\tP\tH\nIshwor Shrestha\tP\tP\tA\tP\tP"}
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
              <Button variant="outline" className="rounded-xl w-full" onClick={() => parseImportText(importText)}>
                Parse Text
              </Button>
              <p className="text-xs text-muted-foreground">Copy rows from Excel and paste here. Tab-separated: Name, Day1, Day2, ...</p>
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-emerald-700">{importPreview.length} records ready to import</label>
                  <button onClick={() => setImportPreview([])} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-border/50 rounded-xl divide-y divide-border/30">
                  {importPreview.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span className="font-medium">{r.empName}</span>
                      <span className="text-muted-foreground">Day {r.day}</span>
                      <span className={cn("px-2 py-0.5 rounded font-bold", STATUS_COLOR[r.status])}>{STATUS_SHORT[r.status]}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full rounded-xl" onClick={confirmImport} disabled={setAttendanceMutation.isPending}>
                  <Check className="w-4 h-4 mr-1.5" /> Confirm Import ({importPreview.length} records)
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
