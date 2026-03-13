import { NEPALI_MONTHS } from "@/lib/constants";
import { useActiveDate } from "@/hooks/use-active-date";
import { Calendar } from "lucide-react";

export function NepaliDateDisplay() {
  const date = useActiveDate();
  const monthName = NEPALI_MONTHS.find(m => m.value === date.month)?.label ?? "";
  const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")} (BS)`;

  return (
    <div className="md:ml-64 flex items-center gap-2 px-4 md:px-8 py-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/40 sticky top-0 z-30 backdrop-blur-sm">
      <Calendar className="w-4 h-4 text-primary shrink-0" />
      <span className="text-sm font-semibold text-foreground">{dateStr}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">· {date.dayOfWeek}, {date.day} {monthName} {date.year} B.S.</span>
    </div>
  );
}
