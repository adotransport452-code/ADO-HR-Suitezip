import { useMemo } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance } from "@/hooks/use-attendance";
import { useOvertime } from "@/hooks/use-overtime";
import { useKitchenExpenses } from "@/hooks/use-kitchen";
import { getCurrentNepaliDate } from "@/lib/nepaliDate";
import { NEPALI_MONTHS } from "@/lib/constants";
import { Users, CheckCircle, XCircle, Clock, UtensilsCrossed, TrendingUp, CalendarDays } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b"];

export default function Dashboard() {
  const today = getCurrentNepaliDate();
  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: overtime } = useOvertime();
  const { data: kitchen } = useKitchenExpenses();

  const monthName = NEPALI_MONTHS.find(m => m.value === today.month)?.label ?? "";

  const totalEmployees = employees?.length ?? 0;

  const todayAttendance = attendance?.filter(
    r => r.nepaliYear === today.year && r.nepaliMonth === today.month && r.day === today.day
  ) ?? [];
  const todayPresent = todayAttendance.filter(r => r.status === "present").length;
  const todayAbsent = todayAttendance.filter(r => r.status === "absent").length;
  const todayHalfDay = todayAttendance.filter(r => r.status === "half_day").length;

  const monthOT = overtime?.filter(r => r.nepaliYear === today.year && r.nepaliMonth === today.month) ?? [];
  const totalOTHours = monthOT.reduce((sum, r) => sum + parseFloat(r.overtimeHours || "0"), 0);

  const monthKitchen = kitchen?.filter(r => r.nepaliYear === today.year && r.nepaliMonth === today.month) ?? [];
  const totalKitchen = monthKitchen.reduce((sum, r) => sum + r.amount, 0);

  const pieData = [
    { name: "Present", value: todayPresent },
    { name: "Absent", value: todayAbsent },
    { name: "Half Day", value: todayHalfDay }
  ].filter(d => d.value > 0);

  const kitchenBarData = useMemo(() => {
    const dayMap = new Map<number, number>();
    monthKitchen.forEach(r => dayMap.set(r.day, (dayMap.get(r.day) ?? 0) + r.amount));
    return [...dayMap.entries()].sort((a, b) => a[0] - b[0]).map(([day, amount]) => ({ day: `D${day}`, amount }));
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

  const cards = [
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Present Today", value: todayPresent, icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Absent Today", value: todayAbsent, icon: XCircle, color: "bg-red-50 text-red-700 border-red-200" },
    { label: "Half Day Today", value: todayHalfDay, icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: `OT Hours (${monthName})`, value: `${totalOTHours.toFixed(1)} hrs`, icon: Clock, color: "bg-violet-50 text-violet-700 border-violet-200" },
    { label: `Kitchen (${monthName})`, value: `Rs. ${totalKitchen.toLocaleString()}`, icon: UtensilsCrossed, color: "bg-orange-50 text-orange-700 border-orange-200" },
  ];

  return (
    <div className="space-y-8">

      {/* Hero Date Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="w-6 h-6 opacity-80" />
          <span className="text-sm font-medium opacity-80">Today's Date (Nepal)</span>
        </div>
        <div className="text-4xl font-display font-bold tracking-tight">
          {today.day} {monthName} {today.year} B.S.
        </div>
        <div className="text-lg opacity-80 mt-1 font-medium">{today.dayOfWeek}</div>
        <div className="mt-3 text-sm opacity-70">Deego Textiles HR Portal · Overview of daily operations</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`border rounded-2xl p-4 flex flex-col gap-2 ${color}`}>
            <Icon className="w-6 h-6" />
            <div>
              <p className="text-xs font-medium opacity-80 leading-tight">{label}</p>
              <p className="text-xl font-bold mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Today's Attendance — {today.dayOfWeek}, {today.day} {monthName}
          </h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No attendance marked today.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} employees`, ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" /> Kitchen Expenses — {monthName} {today.year}
          </h3>
          {kitchenBarData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No kitchen expenses this month.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={kitchenBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {attendBarData.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Monthly Attendance — {monthName} {today.year}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendBarData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Half Day" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
