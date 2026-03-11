import { useState, useEffect } from "react";
import { getCurrentNepaliDate, formatNepaliDate } from "@/lib/nepaliDate";
import { Calendar } from "lucide-react";

export function NepaliDateDisplay() {
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    const updateDate = () => {
      const nepaliDate = getCurrentNepaliDate();
      setDateString(formatNepaliDate(nepaliDate));
    };

    updateDate();
    const interval = setInterval(updateDate, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50">
      <Calendar className="w-5 h-5 text-primary" />
      <span className="text-sm font-semibold text-foreground">{dateString}</span>
    </div>
  );
}
