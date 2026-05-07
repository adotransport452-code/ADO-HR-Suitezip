import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { initPromise, getSupabase, isReady } from "@/lib/supabase";

const TABLE_QUERY_MAP: Record<string, string> = {
  employees:        "/api/employees",
  leaves:           "/api/leaves",
  meals:            "/api/meals",
  attendance:       "/api/attendance",
  overtime:         "/api/overtime",
  kitchen_expenses: "/api/kitchen-expenses",
  office_expenses:  "/api/office-expenses",
  salaries:         "/api/salaries",
};

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    initPromise.then(() => {
      if (cancelled || !isReady()) return;
      try {
        const supabase = getSupabase();
        const channel = supabase
          .channel("db-changes")
          .on(
            "postgres_changes" as any,
            { event: "*", schema: "public" },
            (payload: any) => {
              const queryKey = TABLE_QUERY_MAP[payload.table];
              if (queryKey) {
                queryClient.invalidateQueries({ queryKey: [queryKey] });
              }
            }
          )
          .subscribe();

        cleanup = () => {
          channel.unsubscribe();
        };
      } catch (err: any) {
        if (!cancelled) console.warn("Realtime setup failed:", err?.message ?? err);
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [queryClient]);

  return <>{children}</>;
}
