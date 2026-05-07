import { useState, useMemo } from "react";
import { useOfficeExpenses, useCreateOfficeExpense, useDeleteOfficeExpense } from "@/hooks/use-office";
import { NEPALI_MONTHS } from "@/lib/constants";
import { useActiveDate } from "@/hooks/use-active-date";
import { getDaysInNepaliMonth } from "@/lib/nepaliDate";
import { getMonthCalendar } from "@/lib/calendarUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Plus, Trash2, TrendingUp, CalendarDays, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OfficeExpenses() {
  const today = useActiveDate();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [filterItem, setFilterItem] = useState("");

  // Monthly calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDetailDay, setCalendarDetailDay] = useState<number | null>(null);

  const [formItemName, setFormItemName] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: expenses } = useOfficeExpenses();
  const createExpense = useCreateOfficeExpense();
  const deleteExpense = useDeleteOfficeExpense();

  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);
  const calendarDays = getMonthCalendar(selectedYear, selectedMonth);
  const monthName = NEPALI_MONTHS.find(m => m.value === selectedMonth)?.label ?? "";

  const monthExpenses = expenses?.filter(
    e => e.nepaliYear === selectedYear && e.nepaliMonth === selectedMonth
  ) || [];

  const dayExpenses = selectedDay === "all"
    ? monthExpenses
    : monthExpenses.filter(e => e.day === Number(selectedDay));

  const filteredExpenses = filterItem
    ? dayExpenses.filter(e => e.itemName.toLowerCase().includes(filterItem.toLowerCase()))
    : dayExpenses;

  const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDay = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalByItem = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach(e => { map.set(e.itemName, (map.get(e.itemName) ?? 0) + e.amount); });
    return map;
  }, [monthExpenses]);

  const totalByDay = useMemo(() => {
    const map = new Map<number, number>();
    monthExpenses.forEach(e => { map.set(e.day, (map.get(e.day) ?? 0) + e.amount); });
    return map;
  }, [monthExpenses]);

  const knownItems = useMemo(() => {
    const map = new Map<string, number>();
    expenses?.forEach(e => { map.set(e.itemName.toLowerCase(), e.amount); });
    return map;
  }, [expenses]);

  const uniqueItemNames = useMemo(() => [...new Set(expenses?.map(e => e.itemName) ?? [])], [expenses]);

  const handleItemNameChange = (val: string) => {
    setFormItemName(val);
    if (val.length >= 1) {
      const matches = uniqueItemNames.filter(n => n.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      const knownPrice = knownItems.get(val.toLowerCase());
      if (knownPrice !== undefined) setFormAmount(knownPrice.toString());
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (name: string) => {
    setFormItemName(name);
    const knownPrice = knownItems.get(name.toLowerCase());
    if (knownPrice !== undefined) setFormAmount(knownPrice.toString());
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemName || !formAmount) return;
    const dayNum = selectedDay !== "all" ? Number(selectedDay) : today.day;
    createExpense.mutate({
      nepaliYear: selectedYear,
      nepaliMonth: selectedMonth,
      day: dayNum,
      itemName: formItemName,
      quantity: formQuantity || null,
      amount: Number(formAmount),
      remarks: formRemarks || null
    }, {
      onSuccess: () => {
        setAddOpen(false);
        setFormItemName(""); setFormQuantity(""); setFormAmount(""); setFormRemarks("");
      }
    });
  };

  const calendarDayExpenses = calendarDetailDay
    ? monthExpenses.filter(e => e.day === calendarDetailDay)
    : [];
  const calendarDayTotal = calendarDayExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Office Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {today.dayOfWeek}, {today.day} {NEPALI_MONTHS.find(m => m.value === today.month)?.label} {today.year} B.S.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCalendarOpen(true)} className="rounded-xl border-primary/30 text-primary hover:bg-primary/5">
            <CalendarDays className="w-4 h-4 mr-2" /> Monthly Expense Calendar
          </Button>
          <Button onClick={() => setAddOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Year</label>
          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 10 }, (_, i) => 2078 + i).map(y => <SelectItem key={y} value={y.toString()}>{y} B.S.</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Month</label>
          <Select value={selectedMonth.toString()} onValueChange={v => { setSelectedMonth(Number(v)); setSelectedDay("all"); }}>
            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{NEPALI_MONTHS.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Day</label>
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-28 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>Day {d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Filter by Item</label>
          <Input placeholder="Search item..." value={filterItem} onChange={e => setFilterItem(e.target.value)} className="rounded-xl w-40" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground font-medium">Total This Month</p>
          <p className="text-2xl font-bold text-foreground mt-1">Rs. {totalMonth.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground font-medium">{selectedDay === "all" ? "Unique Items (Month)" : `Total Day ${selectedDay}`}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{selectedDay === "all" ? totalByItem.size : `Rs. ${totalDay.toLocaleString()}`}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground font-medium">Showing Records</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredExpenses.length}</p>
        </div>
      </div>

      {/* Item Breakdown */}
      {totalByItem.size > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Expenses by Item (This Month)</h3>
          <div className="flex flex-wrap gap-2">
            {[...totalByItem.entries()].sort((a, b) => b[1] - a[1]).map(([item, total]) => (
              <div key={item} className="px-3 py-1.5 bg-muted/50 rounded-lg text-sm">
                <span className="font-medium">{item}</span> — <span className="text-primary font-bold">Rs. {total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Day</TableHead>
                <TableHead className="font-semibold">Item Name</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold">Amount (Rs.)</TableHead>
                <TableHead className="font-semibold">Remarks</TableHead>
                <TableHead className="text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mb-2 mx-auto text-muted" />
                  No office expenses for the selected period.
                </TableCell></TableRow>
              ) : filteredExpenses.map(exp => (
                <TableRow key={exp.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">Day {exp.day}</TableCell>
                  <TableCell className="font-semibold">{exp.itemName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{exp.quantity || "—"}</TableCell>
                  <TableCell><span className="font-bold text-primary">Rs. {exp.amount.toLocaleString()}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{exp.remarks || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"
                      onClick={() => { if (confirm("Delete this expense?")) deleteExpense.mutate(exp.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExpenses.length > 0 && (
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell colSpan={3} className="text-right pr-6">
                    {selectedDay !== "all" ? `Day ${selectedDay} Total:` : "Monthly Total:"}
                  </TableCell>
                  <TableCell className="text-primary text-base">
                    Rs. {(selectedDay !== "all" ? totalDay : totalMonth).toLocaleString()}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Monthly Expense Calendar Dialog */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-[680px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Monthly Expense Calendar
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {monthName} {selectedYear} B.S. · Total: <span className="font-bold text-primary">Rs. {totalMonth.toLocaleString()}</span>
            </p>
          </DialogHeader>

          {/* Calendar header row */}
          <div className="grid grid-cols-7 gap-1.5 mt-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className={cn("text-center text-xs font-bold py-2 rounded-lg",
                d === "Sat" ? "text-red-500 bg-red-50" : "text-muted-foreground bg-muted/40")}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((dayInfo, idx) => {
              if (!dayInfo.isCurrentMonth) {
                return <div key={`empty-${idx}`} className="aspect-square rounded-xl bg-muted/15" />;
              }
              const dayTotal = totalByDay.get(dayInfo.day) ?? 0;
              const hasExpenses = dayTotal > 0;
              const expCount = monthExpenses.filter(e => e.day === dayInfo.day).length;
              const isSat = dayInfo.dayOfWeek === "Sat";

              return (
                <button
                  key={dayInfo.day}
                  onClick={() => setCalendarDetailDay(dayInfo.day)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-center p-1 border",
                    hasExpenses
                      ? "bg-primary/10 border-primary/30 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10 cursor-pointer"
                      : isSat
                      ? "bg-red-50/50 border-red-100 hover:bg-red-50 cursor-pointer"
                      : "bg-card border-border/30 hover:bg-muted/40 cursor-pointer"
                  )}
                >
                  <span className={cn("text-sm font-bold leading-none",
                    isSat ? "text-red-500" : hasExpenses ? "text-primary" : "text-foreground")}>
                    {dayInfo.day}
                  </span>
                  {hasExpenses ? (
                    <>
                      <span className="text-[9px] font-bold text-primary mt-1 leading-none">
                        Rs.{dayTotal >= 1000 ? `${(dayTotal / 1000).toFixed(1)}k` : dayTotal}
                      </span>
                      <span className="text-[8px] text-muted-foreground mt-0.5">{expCount} item{expCount !== 1 ? "s" : ""}</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/40 mt-1">—</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/30 inline-block" />
              Has expenses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-100 inline-block" />
              Saturday
            </span>
            <span className="ml-auto text-primary font-semibold">
              {monthExpenses.length} total entries · Rs. {totalMonth.toLocaleString()}
            </span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Day Detail Dialog */}
      <Dialog open={!!calendarDetailDay} onOpenChange={v => !v && setCalendarDetailDay(null)}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Day {calendarDetailDay} — {monthName} {selectedYear} B.S.
            </DialogTitle>
          </DialogHeader>

          {calendarDayExpenses.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="w-12 h-12 mx-auto text-muted mb-3" />
              <p className="text-muted-foreground font-medium">No expenses recorded for this day.</p>
              <Button className="mt-4 rounded-xl" onClick={() => {
                setCalendarDetailDay(null);
                setCalendarOpen(false);
                setSelectedDay(calendarDetailDay!.toString());
                setAddOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Expense for This Day
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mt-2 max-h-[55vh] overflow-y-auto pr-1">
                {calendarDayExpenses.map((exp, i) => (
                  <div key={exp.id} className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-colors",
                    i % 2 === 0 ? "bg-muted/30 border-border/40" : "bg-card border-border/30"
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="font-semibold text-sm text-foreground truncate">{exp.itemName}</p>
                      </div>
                      <div className="flex gap-3 mt-1 ml-7">
                        {exp.quantity && <p className="text-xs text-muted-foreground">Qty: {exp.quantity}</p>}
                        {exp.remarks && <p className="text-xs text-muted-foreground italic">{exp.remarks}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-primary text-sm">Rs. {exp.amount.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Delete this expense?")) { deleteExpense.mutate(exp.id); } }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Day total */}
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between bg-primary/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total for Day {calendarDetailDay}</p>
                  <p className="text-xl font-bold text-primary mt-0.5">Rs. {calendarDayTotal.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{calendarDayExpenses.length} item{calendarDayExpenses.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Add Office Expense</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Adding for: {selectedDay !== "all" ? `Day ${selectedDay}` : `Day ${today.day}`} · {NEPALI_MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5 relative">
              <label className="text-sm font-semibold">Item Name * <span className="text-xs text-muted-foreground font-normal">(auto-suggests previous price)</span></label>
              <Input
                placeholder="e.g. Stationery, Internet Bill" value={formItemName}
                onChange={e => handleItemNameChange(e.target.value)}
                onFocus={() => formItemName && setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="rounded-xl" required
              />
              {showSuggestions && (
                <div className="absolute z-50 w-full bg-card border border-border rounded-xl shadow-lg mt-1 overflow-hidden">
                  {suggestions.map(s => (
                    <button key={s} type="button" onMouseDown={() => handleSelectSuggestion(s)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex justify-between">
                      <span>{s}</span>
                      <span className="text-muted-foreground">Rs. {knownItems.get(s.toLowerCase())}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Quantity</label>
                <Input placeholder="e.g. 2 pcs" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Amount (Rs.) *</label>
                <Input type="number" min="0" placeholder="500" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="rounded-xl" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Remarks</label>
              <Input placeholder="Optional..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={!formItemName || !formAmount || createExpense.isPending}>
              {createExpense.isPending ? "Saving..." : "Add Expense"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
