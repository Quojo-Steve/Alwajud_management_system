import { ReactNode } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Factory,
  LayoutDashboard,
  RefreshCcw,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/cycles", label: "Production Cycles", icon: RefreshCcw },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/orders", label: "Orders", icon: ShoppingCart },
  { path: "/receipts", label: "Receipts", icon: Receipt },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center shadow-gold">
                <Factory className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold text-sidebar-foreground">
                  ALWAJUD
                </h1>
                <p className="text-xs text-sidebar-foreground/60">VENTURES</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/dashboard" &&
                  location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(isActive ? "nav-item-active" : "nav-item")}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="nav-item w-full text-left text-sidebar-foreground/70 hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-base">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background border-b border-border px-4 lg:px-8 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          <div className="flex-1">
            <h2 className="text-xl font-display font-semibold text-foreground">
              {navItems.find(
                (item) =>
                  location.pathname === item.path ||
                  (item.path !== "/dashboard" &&
                    location.pathname.startsWith(item.path)),
              )?.label || "Dashboard"}
            </h2>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
