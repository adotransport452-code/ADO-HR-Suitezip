import { useState, useEffect } from "react";
import { getActiveNepaliDate, onDateChange } from "@/lib/dateStore";
import type { NepaliDate } from "@/lib/nepaliDate";

export function useActiveDate(): NepaliDate {
  const [date, setDate] = useState<NepaliDate>(getActiveNepaliDate);

  useEffect(() => {
    const unsubscribe = onDateChange(setDate);
    return unsubscribe;
  }, []);

  return date;
}
