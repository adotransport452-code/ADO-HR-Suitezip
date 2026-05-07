import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance } from "@/hooks/use-attendance";
import { useKitchenExpenses } from "@/hooks/use-kitchen";
import { useActiveDate } from "@/hooks/use-active-date";
import { getNepaliDate, getDaysInNepaliMonth, bsToGregorian } from "@/lib/nepaliDate";
import { NEPALI_MONTHS } from "@/lib/constants";
import { setActiveNepaliDate } from "@/lib/dateStore";
import { Users, CheckCircle, XCircle, Clock, UtensilsCrossed, TrendingUp, CalendarDays, Pencil, Check, X, Globe, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b"];
const ENGLISH_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ENGLISH_MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_OF_WEEK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function computeDayOfWeek(year: number, month: number, day: number): string {
  const REF = { year: 2082, month: 11, day: 28, dow: 4 };
  const refDayNum = REF.year * 365 + REF.month * 30 + REF.day;
  const targetDayNum = year * 365 + month * 30 + day;
  const totalDays = targetDayNum - refDayNum;
  const dow = ((REF.dow + totalDays) % 7 + 7) % 7;
  return DAYS_OF_WEEK[dow];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function Dashboard() {
  const today = useActiveDate();
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState<"bs" | "ad">("bs");

  // BS edit state
  const [editYear, setEditYear] = useState(today.year);
  const [editMonth, setEditMonth] = useState(today.month);
  const [editDay, setEditDay] = useState(today.day);

  // AD edit state
  const adDate = bsToGregorian(today.year, today.month, today.day);
  const [adEditYear, setAdEditYear] = useState(adDate.getFullYear());
  const [adEditMonth, setAdEditMonth] = useState(adDate.getMonth() + 1);
  const [adEditDay, setAdEditDay] = useState(adDate.getDate());

  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: kitchen } = useKitchenExpenses();

  const monthName = NEPALI_MONTHS.find(m => m.value === today.month)?.label ?? "";
  const totalEmployees = employees?.length ?? 0;

  const todayAttendance = attendance?.filter(
    r => r.nepaliYear === today.year && r.nepaliMonth === today.month && r.day === today.day
  ) ?? [];
  const todayPresent = todayAttendance.filter(r => r.status === "present").length;
  const todayAbsent = todayAttendance.filter(r => r.status === "absent").length;
  const todayHalfDay = todayAttendance.filter(r => r.status === "half_day").length;
  const todayTotal = todayPresent + todayAbsent + todayHalfDay;
  const presentPct = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

  const monthKitchen = kitchen?.filter(r => r.nepaliYear === today.year && r.nepaliMonth === today.month) ?? [];
  const totalKitchen = monthKitchen.reduce((sum, r) => sum + r.amount, 0);

  const englishDateStr = `${ENGLISH_MONTHS[adDate.getMonth()]} ${adDate.getDate()}, ${adDate.getFullYear()}`;

  const pieData = [
    { name: "Present", value: todayPresent },
    { name: "Absent", value: todayAbsent },
    { name: "Half Day", value: todayHalfDay }
  ].filter(d => d.value > 0);

  const kitchenBarData = useMemo(() => {
    const dayMap = new Map<number, number>();
    monthKitchen.forEach(r => dayMap.set(r.day, (dayMap.get(r.day) ?? 0) + r.amount));
    return [...dayMap.entries()].sort((a, b) => a[0] - b[0]).map(([day, amount]) => ({ day: `${day}`, amount }));
  }, [monthKitchen]);

  const attendBarData = useMemo(() => {
    return employees?.map(emp => {
      const empRec = attendance?.filter(
        r => r.employeeId === emp.id && r.nepaliYear === today.year && r.nepaliMonth === today.month
      ) ?? [];
      return {
        name: emp.name.split(" ")[0],
        Present: empRec.filter(r => r.status === "present").length,
        Absent: empRec.filter(r => r.status === "absent").length,
        "Half Day": empRec.filter(r => r.status === "half_day").length,
      };
    }).filter(d => d.Present + d.Absent + d["Half Day"] > 0) ?? [];
  }, [employees, attendance, today]);

  const startEdit = () => {
    setEditYear(today.year); setEditMonth(today.month); setEditDay(today.day);
    const ad = bsToGregorian(today.year, today.month, today.day);
    setAdEditYear(ad.getFullYear()); setAdEditMonth(ad.getMonth() + 1); setAdEditDay(ad.getDate());
    setEditMode("bs");
    setEditing(true);
  };

  const saveDate = () => {
    if (editMode === "ad") {
      const adDateObj = new Date(adEditYear, adEditMonth - 1, adEditDay);
      const bsDate = getNepaliDate(adDateObj);
      setActiveNepaliDate(bsDate);
    } else {
      const dow = computeDayOfWeek(editYear, editMonth, editDay);
      setActiveNepaliDate({ year: editYear, month: editMonth, day: editDay, dayOfWeek: dow });
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditYear(today.year); setEditMonth(today.month); setEditDay(today.day);
    setEditing(false);
  };

  const daysInEditMonth = getDaysInNepaliMonth(editYear, editMonth);
  const daysInAdEditMonth = getDaysInMonth(adEditYear, adEditMonth);

  return (
    <div className="space-y-7">
      {/* Hero Date Banner */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl p-6 text-primary-foreground shadow-xl shadow-primary/25 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)"}} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold opacity-70 tracking-widest uppercase">Nepal — Bikram Sambat</span>
            </div>
            {!editing && (
              <button onClick={startEdit}
                className="ml-auto flex items-center gap-1.5 text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors px-3 py-1.5 rounded-xl font-medium">
                <Pencil className="w-3.5 h-3.5" /> Edit Date
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button onClick={() => setEditMode("bs")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    editMode === "bs" ? "bg-primary-foreground text-primary" : "bg-primary-foreground/20 hover:bg-primary-foreground/30")}>
                  <Calendar className="w-3.5 h-3.5" /> Nepali Date (BS)
                </button>
                <button onClick={() => setEditMode("ad")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    editMode === "ad" ? "bg-primary-foreground text-primary" : "bg-primary-foreground/20 hover:bg-primary-foreground/30")}>
                  <Globe className="w-3.5 h-3.5" /> English Date (AD)
                </button>
              </div>

              {editMode === "bs" ? (
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-xs opacity-70 font-medium">Year (BS)</label>
                    <Select value={editYear.toString()} onValueChange={v => { setEditYear(Number(v)); setEditDay(1); }}>
                      <SelectTrigger className="w-28 rounded-xl bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{Array.from({ length: 30 }, (_, i) => 2075 + i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs opacity-70 font-medium">Month</label>
                    <Select value={editMonth.toString()} onValueChange={v => { setEditMonth(Number(v)); setEditDay(1); }}>
                      <SelectTrigger className="w-36 rounded-xl bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{NEPALI_MONTHS.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs opacity-70 font-medium">Day</label>
                    <Select value={editDay.toString()} onValueChange={v => setEditDay(Number(v))}>
                      <SelectTrigger className="w-20 rounded-xl bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{Array.from({ length: daysInEditMonth }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-xs opacity-70 font-medium">Year (AD)</label>
                    <Select value={adEditYear.toString()} onValueChange={v => { setAdEditYear(Number(v)); setAdEditDay(1); }}>
                      <SelectTrigger className="w-28 rounded-xl bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{Array.from({ length: 20 }, (_, i) => 2018 + i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs opacity-70 font-medium">Month (AD)</label>
                    <Select value={adEditMonth.toString()} onValueChange={v => { setAdEditMonth(Number(v)); setAdEditDay(1); }}>
                      <SelectTrigger className="w-36 rounded-xl bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{ENGLISH_MONTHS.map((mn, i) => <SelectItem key={i+1} value={(i+1).toString()}>{mn}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs opacity-70 font-medium">Day</label>
                    <Select value={adEditDay.toString()} onValueChange={v => setAdEditDay(Number(v))}>
                      <SelectTrigger className="w-20 rounded-xl bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{Array.from({ length: daysInAdEditMonth }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={saveDate} className="flex items-center gap-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
                  <Check className="w-4 h-4" /> Save Date
                </button>
                <button onClick={cancelEdit} className="flex items-center gap-1.5 text-sm bg-primary-foreground/20 hover:bg-primary-foreground/30 px-4 py-2 rounded-xl font-semibold transition-colors">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
                  {today.day} {monthName} {today.year}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg opacity-85 font-semibold">{today.dayOfWeek}</span>
                  <span className="opacity-40">·</span>
                  <span className="font-mono text-sm opacity-70 bg-primary-foreground/15 px-2.5 py-0.5 rounded-lg">B.S.</span>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <div className="flex items-center gap-2 bg-primary-foreground/15 rounded-xl px-4 py-2">
                  <Globe className="w-4 h-4 opacity-70" />
                  <div>
                    <div className="text-xs opacity-60 font-medium leading-none mb-0.5">English Date</div>
                    <div className="text-sm font-bold">{englishDateStr}</div>
                  </div>
                </div>
                <div className="text-xs opacity-50">ADO International Transport Nepal</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600/80 uppercase tracking-wide">Total Staff</p>
            <p className="text-3xl font-bold text-blue-700 leading-none mt-1">{totalEmployees}</p>
            <p className="text-xs text-blue-500/70 mt-0.5">Active employees</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wide">Present</p>
            <p className="text-3xl font-bold text-emerald-700 leading-none mt-1">{todayPresent}</p>
            <p className="text-xs text-emerald-500/70 mt-0.5">{todayTotal > 0 ? `${presentPct}% of today` : "No records yet"}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600/80 uppercase tracking-wide">Absent</p>
            <p className="text-3xl font-bold text-red-700 leading-none mt-1">{todayAbsent}</p>
            <p className="text-xs text-red-500/70 mt-0.5">Today's absence</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600/80 uppercase tracking-wide">Half Day</p>
            <p className="text-3xl font-bold text-amber-700 leading-none mt-1">{todayHalfDay}</p>
            <p className="text-xs text-amber-500/70 mt-0.5">Today</p>
          </div>
        </div>
      </div>

      {/* Kitchen + Today Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kitchen Expenses Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/40 border border-orange-200/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-orange-600/80 uppercase tracking-wide">Kitchen</p>
                <p className="text-xs text-orange-500/70">{monthName} {today.year}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-orange-700">Rs. {totalKitchen.toLocaleString()}</p>
            <p className="text-xs text-orange-500/70 mt-1">{monthKitchen.length} expense entries this month</p>
          </div>
          {kitchenBarData.length > 0 && (
            <div className="mt-4 -mx-1">
              <ResponsiveContainer width="100%" height={60}>
                <BarChart data={kitchenBarData.slice(-10)} barSize={8}>
                  <Bar dataKey="amount" fill="#f97316" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Today's Attendance Pie */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Today's Attendance
          </h3>
          <p className="text-xs text-muted-foreground mb-4">{today.dayOfWeek}, {today.day} {monthName} {today.year} B.S. &nbsp;·&nbsp; {englishDateStr}</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No attendance marked today.
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} employees`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Kitchen Expenses Full Chart */}
      {kitchenBarData.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" /> Kitchen Expenses — {monthName} {today.year} B.S.
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={kitchenBarData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={v => `Day ${v}`} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Amount"]} labelFormatter={l => `Day ${l}`} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Attendance Bar Chart */}
      {attendBarData.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Monthly Attendance Summary — {monthName} {today.year} B.S.
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendBarData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Half Day" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
