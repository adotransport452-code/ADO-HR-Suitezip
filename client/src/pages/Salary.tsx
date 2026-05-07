import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useSalaries, useSetSalary } from "@/hooks/use-salary";
import { useActiveDate } from "@/hooks/use-active-date";
import { NEPALI_MONTHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Search, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@shared/schema";

const PAYMENT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "esewa", label: "eSewa" },
  { value: "khalti", label: "Khalti" },
];

function getStatus(total: number, provided: number): "paid" | "partial" | "unpaid" {
  if (total === 0) return "unpaid";
  if (provided >= total) return "paid";
  if (provided > 0) return "partial";
  return "unpaid";
}

const STATUS_CONFIG = {
  paid:    { label: "Paid",    className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  partial: { label: "Partial", className: "bg-amber-100 text-amber-700 border-amber-200" },
  unpaid:  { label: "Unpaid",  className: "bg-red-100 text-red-700 border-red-200" },
};

export default function Salary() {
  const today = useActiveDate();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [search, setSearch] = useState("");
  const [payDialog, setPayDialog] = useState<Employee | null>(null);

  const [formTotal, setFormTotal] = useState("");
  const [formProvided, setFormProvided] = useState("");
  const [formPaymentType, setFormPaymentType] = useState("cash");
  const [formPaymentDate, setFormPaymentDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data: employees } = useEmployees();
  const { data: salaries } = useSalaries();
  const setSalaryMutation = useSetSalary();

  const monthName = NEPALI_MONTHS.find(m => m.value === month)?.label ?? "";
  const years = Array.from({ length: 20 }, (_, i) => today.year - 5 + i);

  const filtered = useMemo(() =>
    (employees ?? []).filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase())
    ),
    [employees, search]
  );

  function getSalaryRecord(empId: number) {
    return salaries?.find(
      s => s.employeeId === empId && s.nepaliYear === year && s.nepaliMonth === month
    );
  }

  function openPayDialog(emp: Employee) {
    const existing = getSalaryRecord(emp.id);
    setFormTotal(existing?.totalSalary?.toString() ?? "");
    setFormProvided(existing?.providedSalary?.toString() ?? "");
    setFormPaymentType(existing?.paymentType ?? "cash");
    setFormPaymentDate(existing?.paymentDate ?? "");
    setFormNotes(existing?.notes ?? "");
    setPayDialog(emp);
  }

  async function handleSave() {
    if (!payDialog) return;
    await setSalaryMutation.mutateAsync({
      employeeId: payDialog.id,
      nepaliYear: year,
      nepaliMonth: month,
      totalSalary: Number(formTotal) || 0,
      providedSalary: Number(formProvided) || 0,
      paymentType: formPaymentType || null,
      paymentDate: formPaymentDate || null,
      notes: formNotes || null,
    } as any);
    setPayDialog(null);
  }

  const totalPayable = filtered.reduce((sum, emp) => {
    const rec = getSalaryRecord(emp.id);
    return sum + (rec?.totalSalary ?? 0);
  }, 0);
  const totalPaid = filtered.reduce((sum, emp) => {
    const rec = getSalaryRecord(emp.id);
    return sum + (rec?.providedSalary ?? 0);
  }, 0);
  const totalRemaining = totalPayable - totalPaid;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Salary Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage monthly salaries for all employees</p>
        </div>
      </div>

      {/* Month / Year Selector */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-[140px] text-center">
            <p className="font-bold text-foreground">{monthName} {year}</p>
            <p className="text-xs text-muted-foreground">Bikram Sambat</p>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={month.toString()} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-32 rounded-xl h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NEPALI_MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24 rounded-xl h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative ml-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employee…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-8 w-48 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-600/80 uppercase tracking-wide">Total Payable</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">Rs. {totalPayable.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">Rs. {totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/60 rounded-2xl p-4">
          <p className="text-xs font-semibold text-red-600/80 uppercase tracking-wide">Remaining</p>
          <p className="text-2xl font-bold text-red-700 mt-1">Rs. {totalRemaining.toLocaleString()}</p>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total Salary</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Provided</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Remaining</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Payment</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    {(employees?.length ?? 0) === 0
                      ? "No employees found. Add employees first."
                      : "No employees match your search."}
                  </td>
                </tr>
              )}
              {filtered.map(emp => {
                const rec = getSalaryRecord(emp.id);
                const total = rec?.totalSalary ?? 0;
                const provided = rec?.providedSalary ?? 0;
                const remaining = total - provided;
                const status = getStatus(total, provided);
                const statusCfg = STATUS_CONFIG[status];
                const payType = PAYMENT_TYPES.find(p => p.value === rec?.paymentType)?.label;
                return (
                  <tr key={emp.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.designation}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {total > 0 ? `Rs. ${total.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">
                      {provided > 0 ? `Rs. ${provided.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={cn(remaining > 0 ? "text-red-600" : "text-emerald-600")}>
                        {total > 0 ? `Rs. ${remaining.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {payType && <span className="text-xs font-medium">{payType}</span>}
                        {rec?.paymentDate && <span className="text-xs text-muted-foreground">{rec.paymentDate}</span>}
                        {!payType && !rec?.paymentDate && <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", statusCfg.className)}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 rounded-lg text-xs"
                        onClick={() => openPayDialog(emp)}
                        data-testid={`button-pay-${emp.id}`}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        {rec ? "Edit" : "Pay"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Dialog */}
      <Dialog open={!!payDialog} onOpenChange={open => !open && setPayDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Salary — {payDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="text-sm text-muted-foreground">{payDialog?.designation} · {monthName} {year}</div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Total Salary (Rs.)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formTotal}
                  onChange={e => setFormTotal(e.target.value)}
                  data-testid="input-total-salary"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Provided Salary (Rs.)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formProvided}
                  onChange={e => setFormProvided(e.target.value)}
                  data-testid="input-provided-salary"
                />
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Remaining Salary</span>
                <span className={cn(
                  "text-lg font-bold",
                  (Number(formTotal) - Number(formProvided)) > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  Rs. {((Number(formTotal) || 0) - (Number(formProvided) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Type</Label>
              <Select value={formPaymentType} onValueChange={setFormPaymentType}>
                <SelectTrigger data-testid="select-payment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={formPaymentDate}
                onChange={e => setFormPaymentDate(e.target.value)}
                data-testid="input-payment-date"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any remarks…"
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                data-testid="input-salary-notes"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={setSalaryMutation.isPending}
                data-testid="button-save-salary"
              >
                {setSalaryMutation.isPending ? "Saving…" : "Save Salary"}
              </Button>
              <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
