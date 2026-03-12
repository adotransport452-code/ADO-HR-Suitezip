import { useState, useEffect } from "react";
import { formatNepaliDate } from "@/lib/nepaliDate";
import { getActiveNepaliDate } from "@/lib/dateStore";
import { Calendar } from "lucide-react";

export function NepaliDateDisplay() {
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    const update = () => setDateString(formatNepaliDate(getActiveNepaliDate()));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="md:ml-64 flex items-center gap-2 px-4 md:px-8 py-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/40 sticky top-0 z-30 backdrop-blur-sm">
      <Calendar className="w-4 h-4 text-primary shrink-0" />
      <span className="text-sm font-semibold text-foreground">{dateString}</span>
    </div>
  );
}
