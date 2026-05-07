import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Leave, InsertLeave } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const ATT_KEY = "/api/attendance";

export function useLeaves() {
  return useQuery({
    queryKey: [api.leaves.list.path],
    queryFn: async () => {
      const res = await fetch(api.leaves.list.path);
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json() as Promise<Leave[]>;
    }
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertLeave, "id">) => {
      const res = await fetch(api.leaves.create.path, {
        method: api.leaves.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to log leave" }));
        throw new Error(error.message);
      }
      const leave = await res.json();

      // Auto-sync: mark as absent in attendance (only if no record exists)
      try {
        const attRes = await fetch(ATT_KEY);
        if (attRes.ok) {
          const allAtt: any[] = await attRes.json();
          const exists = allAtt.some(a =>
            a.employeeId === data.employeeId &&
            a.nepaliYear === data.nepaliYear &&
            a.nepaliMonth === data.nepaliMonth &&
            a.day === data.day
          );
          if (!exists) {
            await fetch(ATT_KEY, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: data.employeeId,
                nepaliYear: data.nepaliYear,
                nepaliMonth: data.nepaliMonth,
                day: data.day,
                status: "absent",
                checkInTime: null,
                checkOutTime: null,
                remarks: "Auto-marked: Leave taken"
              })
            });
          }
        }
      } catch {}

      return leave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      queryClient.invalidateQueries({ queryKey: [ATT_KEY] });
      toast({ title: "Leave Added", description: "Employee marked as absent in attendance automatically." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (leave: { id: number; employeeId: number; nepaliYear: number; nepaliMonth: number; day: number }) => {
      // Delete the leave record
      const url = buildUrl(api.leaves.delete.path, { id: leave.id });
      const res = await fetch(url, { method: api.leaves.delete.method });
      if (!res.ok) throw new Error("Failed to delete leave");

      // Auto-sync: also delete matching attendance record
      try {
        const attRes = await fetch(ATT_KEY);
        if (attRes.ok) {
          const allAtt: any[] = await attRes.json();
          const matching = allAtt.find(a =>
            a.employeeId === leave.employeeId &&
            a.nepaliYear === leave.nepaliYear &&
            a.nepaliMonth === leave.nepaliMonth &&
            a.day === leave.day
          );
          if (matching) {
            await fetch(`${ATT_KEY}/${matching.id}`, { method: "DELETE" });
          }
        }
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      queryClient.invalidateQueries({ queryKey: [ATT_KEY] });
      toast({ title: "Leave Removed", description: "Leave and linked attendance record deleted." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
