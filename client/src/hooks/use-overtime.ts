import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Overtime, InsertOvertime } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const KEY = "/api/overtime";

export function useOvertime() {
  return useQuery<Overtime[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch(KEY);
      if (!res.ok) throw new Error("Failed to fetch overtime");
      return res.json();
    }
  });
}

export function useCreateOvertime() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertOvertime) => {
      const res = await fetch(KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save overtime");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "Overtime recorded" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });
}

export function useDeleteOvertime() {
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
