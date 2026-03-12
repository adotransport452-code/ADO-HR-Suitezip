import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { KitchenExpense, InsertKitchenExpense } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const KEY = "/api/kitchen-expenses";

export function useKitchenExpenses() {
  return useQuery<KitchenExpense[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch(KEY);
      if (!res.ok) throw new Error("Failed to fetch kitchen expenses");
      return res.json();
    }
  });
}

export function useCreateKitchenExpense() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertKitchenExpense) => {
      const res = await fetch(KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save expense");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "Expense recorded" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });
}

export function useDeleteKitchenExpense() {
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
