import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Attendance, InsertAttendance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const KEY = "/api/attendance";
const LEAVE_KEY = "/api/leaves";

export function useAttendance() {
  return useQuery<Attendance[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch(KEY);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    }
  });
}

export function useSetAttendance() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertAttendance) => {
      const res = await fetch(KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save attendance");
      const att = await res.json();

      // Auto-sync: if marking as absent, also add a leave record if one doesn't exist
      if (data.status === "absent") {
        try {
          const leaveRes = await fetch(LEAVE_KEY);
          if (leaveRes.ok) {
            const allLeaves: any[] = await leaveRes.json();
            const hasLeave = allLeaves.some(l =>
              l.employeeId === data.employeeId &&
              l.nepaliYear === data.nepaliYear &&
              l.nepaliMonth === data.nepaliMonth &&
              l.day === data.day
            );
            if (!hasLeave) {
              await fetch(LEAVE_KEY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  employeeId: data.employeeId,
                  nepaliYear: data.nepaliYear,
                  nepaliMonth: data.nepaliMonth,
                  day: data.day
                })
              });
            }
          }
        } catch {}
      }

      return att;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [LEAVE_KEY] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (rec: { id: number; employeeId: number; nepaliYear: number; nepaliMonth: number; day: number }) => {
      // Delete the attendance record
      const res = await fetch(`${KEY}/${rec.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      // Auto-sync: also delete matching leave record
      try {
        const leaveRes = await fetch(LEAVE_KEY);
        if (leaveRes.ok) {
          const allLeaves: any[] = await leaveRes.json();
          const matching = allLeaves.find(l =>
            l.employeeId === rec.employeeId &&
            l.nepaliYear === rec.nepaliYear &&
            l.nepaliMonth === rec.nepaliMonth &&
            l.day === rec.day
          );
          if (matching) {
            await fetch(`${LEAVE_KEY}/${matching.id}`, { method: "DELETE" });
          }
        }
      } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [LEAVE_KEY] });
      toast({ title: "Deleted", description: "Attendance and linked leave record deleted." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });
}
