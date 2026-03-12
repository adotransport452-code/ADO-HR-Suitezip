import { useMemo } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance } from "@/hooks/use-attendance";
import { useOvertime } from "@/hooks/use-overtime";
import { useKitchenExpenses } from "@/hooks/use-kitchen";
import { getCurrentNepaliDate } from "@/lib/nepaliDate";
import { NEPALI_MONTHS } from "@/lib/constants";
import { Users, CheckCircle, XCircle, Clock, UtensilsCrossed, TrendingUp } from "lucide-react";
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

  const totalEmployees = employees?.length ?? 0;

  // Today's attendance
  const todayAttendance = attendance?.filter(
    r => r.nepaliYear === today.year && r.nepaliMonth === today.month && r.day === today.day
  ) ?? [];
  const todayPresent = todayAttendance.filter(r => r.status === "present").length;
  const todayAbsent = todayAttendance.filter(r => r.status === "absent").length;

  // This month's overtime
  const monthOT = overtime?.filter(
    r => r.nepaliYear === today.year && r.nepaliMonth === today.month
  ) ?? [];
  const totalOTHours = monthOT.reduce((sum, r) => sum + parseFloat(r.overtimeHours || "0"), 0);

  // This month's kitchen expenses
  const monthKitchen = kitchen?.filter(
    r => r.nepaliYear === today.year && r.nepaliMonth === today.month
  ) ?? [];
  const totalKitchen = monthKitchen.reduce((sum, r) => sum + r.amount, 0);

  // Attendance pie chart data (today)
  const pieData = [
    { name: "Present", value: todayPresent },
    { name: "Absent", value: todayAbsent },
    { name: "Half Day", value: todayAttendance.filter(r => r.status === "half_day").length }
  ].filter(d => d.value > 0);

  // Monthly kitchen expenses bar chart (by day)
  const kitchenBarData = useMemo(() => {
    const dayMap = new Map<number, number>();
    monthKitchen.forEach(r => dayMap.set(r.day, (dayMap.get(r.day) ?? 0) + r.amount));
    return [...dayMap.entries()].sort((a, b) => a[0] - b[0]).map(([day, amount]) => ({ day: `D${day}`, amount }));
  }, [monthKitchen]);

  // Monthly attendance bar chart (per employee)
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
    }) ?? [];
  }, [employees, attendance, today]);

  const monthName = NEPALI_MONTHS.find(m => m.value === today.month)?.label ?? "";

  const cards = [
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "bg-blue-50 text-blue-600 border-blue-200" },
    { label: "Today Present", value: todayPresent, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { label: "Today Absent", value: todayAbsent, icon: XCircle, color: "bg-red-50 text-red-600 border-red-200" },
    { label: `OT Hours (${monthName})`, value: `${totalOTHours.toFixed(1)} hrs`, icon: Clock, color: "bg-violet-50 text-violet-600 border-violet-200" },
    { label: `Kitchen Exp. (${monthName})`, value: `Rs. ${totalKitchen.toLocaleString()}`, icon: UtensilsCrossed, color: "bg-amber-50 text-amber-600 border-amber-200" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {today.dayOfWeek}, {today.day} {monthName} {today.year} B.S. — Overview of operations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`border rounded-2xl p-5 flex flex-col gap-3 ${color}`}>
            <Icon className="w-7 h-7" />
            <div>
              <p className="text-xs font-medium opacity-80">{label}</p>
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary Pie */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Today's Attendance
          </h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No attendance marked today.
            </div>
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

        {/* Monthly Kitchen Expenses Bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" /> Kitchen Expenses — {monthName} {today.year}
          </h3>
          {kitchenBarData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No kitchen expenses this month.
            </div>
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

      {/* Attendance per Employee (Month) */}
      {attendBarData.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Monthly Attendance — {monthName} {today.year}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendBarData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
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
