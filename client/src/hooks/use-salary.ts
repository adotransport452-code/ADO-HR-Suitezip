import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Salary, InsertSalary } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const KEY = "/api/salaries";

export function useSalaries() {
  return useQuery<Salary[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch(KEY);
      if (!res.ok) throw new Error("Failed to fetch salaries");
      return res.json();
    },
  });
}

export function useSetSalary() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertSalary) => {
      const res = await fetch(KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "Salary saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateSalary() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSalary> }) => {
      const res = await fetch(`${KEY}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update salary");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "Salary updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteSalary() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${KEY}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "Salary record deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
