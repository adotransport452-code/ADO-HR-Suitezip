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
    mutationFn: async (id: number) => {
      const res = await fetch(`${KEY}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "Deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });
}
