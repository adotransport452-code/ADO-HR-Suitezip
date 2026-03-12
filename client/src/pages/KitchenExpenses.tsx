import { useState, useEffect, useMemo } from "react";
import { useKitchenExpenses, useCreateKitchenExpense, useDeleteKitchenExpense } from "@/hooks/use-kitchen";
import { NEPALI_MONTHS } from "@/lib/constants";
import { getCurrentNepaliDate, getDaysInNepaliMonth } from "@/lib/nepaliDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UtensilsCrossed, Plus, Trash2, TrendingUp } from "lucide-react";

export default function KitchenExpenses() {
  const today = getCurrentNepaliDate();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [addOpen, setAddOpen] = useState(false);
  const [filterItem, setFilterItem] = useState("");

  const [formDay, setFormDay] = useState(today.day.toString());
  const [formItemName, setFormItemName] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: expenses } = useKitchenExpenses();
  const createExpense = useCreateKitchenExpense();
  const deleteExpense = useDeleteKitchenExpense();

  const daysInMonth = getDaysInNepaliMonth(selectedYear, selectedMonth);

  const monthExpenses = expenses?.filter(
    e => e.nepaliYear === selectedYear && e.nepaliMonth === selectedMonth
  ) || [];

  const filteredExpenses = filterItem
    ? monthExpenses.filter(e => e.itemName.toLowerCase().includes(filterItem.toLowerCase()))
    : monthExpenses;

  const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalByDay = useMemo(() => {
    const map = new Map<number, number>();
    monthExpenses.forEach(e => {
      map.set(e.day, (map.get(e.day) ?? 0) + e.amount);
    });
    return map;
  }, [monthExpenses]);

  const totalByItem = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach(e => {
      map.set(e.itemName, (map.get(e.itemName) ?? 0) + e.amount);
    });
    return map;
  }, [monthExpenses]);

  // Auto-suggest previous price for known items
  const knownItems = useMemo(() => {
    const map = new Map<string, number>();
    expenses?.forEach(e => { map.set(e.itemName.toLowerCase(), e.amount); });
    return map;
  }, [expenses]);

  const uniqueItemNames = useMemo(() => {
    return [...new Set(expenses?.map(e => e.itemName) ?? [])];
  }, [expenses]);

  const handleItemNameChange = (val: string) => {
    setFormItemName(val);
    if (val.length >= 1) {
      const matches = uniqueItemNames.filter(n => n.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);

      // Auto-fill amount if known item
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
    if (!formDay || !formItemName || !formAmount) return;
    createExpense.mutate({
      nepaliYear: selectedYear,
      nepaliMonth: selectedMonth,
      day: Number(formDay),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Kitchen Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track daily kitchen and food expenses with auto-suggestions.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
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
          <p className="text-xs text-muted-foreground font-medium">Unique Items</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalByItem.size}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground font-medium">Total Records</p>
          <p className="text-2xl font-bold text-foreground mt-1">{monthExpenses.length}</p>
        </div>
      </div>

      {/* Top Items */}
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
                  <UtensilsCrossed className="w-12 h-12 mb-2 mx-auto text-muted" />
                  No kitchen expenses recorded this month.
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
                  <TableCell colSpan={3} className="text-right">Monthly Total:</TableCell>
                  <TableCell className="text-primary text-base">Rs. {totalMonth.toLocaleString()}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Add Kitchen Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Day *</label>
              <Select value={formDay} onValueChange={setFormDay}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Day..." /></SelectTrigger>
                <SelectContent>{Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>Day {d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-sm font-semibold">Item Name * <span className="text-xs text-muted-foreground font-normal">(auto-suggests previous price)</span></label>
              <Input
                placeholder="e.g. Rice (Chamal)" value={formItemName}
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
                <Input placeholder="e.g. 5 kg" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Amount (Rs.) *</label>
                <Input type="number" min="0" placeholder="3250" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="rounded-xl" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Remarks</label>
              <Input placeholder="Optional..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={!formDay || !formItemName || !formAmount || createExpense.isPending}>
              {createExpense.isPending ? "Saving..." : "Add Expense"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
