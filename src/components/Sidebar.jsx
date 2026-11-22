import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Settings,
  Wallet,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

function Sidebar() {
  const { pathname } = useLocation();
  const currentPath = pathname.replace(/\/+$/, "") || "/";

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard/",
      icon: LayoutDashboard,
    },
    {
      name: "Transactions",
      path: "/transactions",
      icon: ArrowLeftRight,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: ChartNoAxesCombined,
    },
    {
      name: "My Wallet",
      path: "/wallet",
      icon: Wallet,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="fixed inset-x-3 bottom-3 sm:bottom-4 z-40 mb-4 rounded-2xl bg-[#1e1713] px-2 py-1.5 text-ice-white shadow-[0_20px_50px_rgba(20,14,10,0.35)] ring-1 ring-white/10 backdrop-blur-md lg:sticky lg:top-6 lg:mx-4 lg:mt-6 lg:mb-6 lg:h-[calc(100vh-3rem)] lg:w-60 lg:shrink-0 lg:self-start lg:rounded-3xl lg:px-4 lg:py-6">
      {/* Brand Header */}
      <div className="mb-8 hidden px-2 lg:block">
        <Link
          to="/dashboard/"
          className="group block rounded-xl focus:outline-none focus:ring-2 focus:ring-aurora"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-aurora transition group-hover:text-aurora/80">
            SpendWise
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-none text-ice-white transition group-hover:text-amber-100">
            Ledger
          </h1>
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex items-stretch justify-around lg:flex-col lg:justify-start lg:gap-1.5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const targetBase = item.path.replace(/\/+$/, "") || "/";
          const isActive = currentPath === targetBase;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] leading-tight transition-all duration-150 sm:text-[10px] lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm ${
                isActive
                  ? "bg-aurora font-extrabold text-white shadow-md shadow-aurora/35 ring-1 ring-white/15"
                  : "text-ice-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="w-full truncate text-center lg:text-left">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
