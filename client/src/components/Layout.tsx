import { Link, useLocation } from "wouter";
import {
  Users, Calendar, Building2, Menu, BarChart3, ClipboardList,
  ChefHat, LayoutDashboard, Briefcase, Wallet, ShieldCheck, LogOut, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@assets/image_1778143217552.png";

const NAV_ITEMS = [
  { name: "Dashboard",       href: "/dashboard", icon: LayoutDashboard },
  { name: "Employees",       href: "/employees",  icon: Users },
  { name: "Attendance",      href: "/attendance", icon: ClipboardList },
  { name: "Leave Report",    href: "/leaves",     icon: Calendar },
  { name: "Kitchen Expenses",href: "/kitchen",    icon: ChefHat },
  { name: "Office Expenses", href: "/office",     icon: Briefcase },
  { name: "Salary",          href: "/salary",     icon: Wallet },
  { name: "Overall Report",  href: "/overall",    icon: BarChart3 },
];

const ADMIN_NAV_ITEMS = [
  { name: "User Management", href: "/admin/users", icon: ShieldCheck },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { profile, isAdmin, signOut } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 flex items-center gap-3 border-b border-border/50">
        <div className="w-14 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-blue-700 shrink-0">
          <img src={logoImage} alt="ADO Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-display font-bold text-sm leading-tight text-foreground">ADO Logistics Portal</h1>
          <p className="text-xs text-muted-foreground font-medium">ADO International Transport Nepal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150 text-sm",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Admin</p>
            </div>
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150 text-sm",
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{profile?.fullName || profile?.email || "User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{profile?.role ?? "user"}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <p className="text-[10px] text-center text-muted-foreground/50 mt-2">
          © {new Date().getFullYear()} ADO International Transport Nepal
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-7 rounded-lg overflow-hidden bg-blue-700 flex items-center justify-center">
            <img src={logoImage} alt="ADO Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-foreground text-sm">ADO Logistics Portal</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl shrink-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative flex flex-col w-64 h-full bg-card shadow-2xl animate-in slide-in-from-left-full">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-64 overflow-y-auto min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
