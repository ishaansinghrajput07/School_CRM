import { NavLink } from "react-router-dom";
import { GraduationCap, ChevronsLeft, X } from "lucide-react";
import { NAV_LINKS_BY_ROLE } from "./navLinks";

function NavLinks({ links, collapsed }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              collapsed ? "justify-center" : ""
            } ${
              isActive
                ? "bg-gradient-to-r from-navy-500 to-navy-600 text-white shadow-sm"
                : "text-navy-500 hover:bg-navy-50 hover:text-navy-800 hover:translate-x-0.5"
            }`
          }
        >
          <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!collapsed && label}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-navy-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
              {label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand({ collapsed }) {
  return (
    <div className={`flex items-center gap-2 px-6 py-5 ${collapsed ? "justify-center px-3" : ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy-500 to-violet-600 text-white shadow-sm">
        <GraduationCap size={20} />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold leading-tight text-navy-900">St. Thomas Convent</p>
          <p className="truncate text-xs text-navy-400">Hr. Sec. School, Indore</p>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ role, collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }) {
  const links = NAV_LINKS_BY_ROLE[role] || NAV_LINKS_BY_ROLE.student;

  return (
    <>
      <aside
        className={`relative hidden shrink-0 flex-col border-r border-navy-100 bg-white transition-[width] duration-200 ease-out lg:flex print:hidden ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <Brand collapsed={collapsed} />
        <NavLinks links={links} collapsed={collapsed} />
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center gap-2 border-t border-navy-100 py-3 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft size={16} className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-[1px]" onClick={onCloseMobile} aria-hidden />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-2xl animate-[slide-in_0.22s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex items-center justify-between pr-3">
              <Brand collapsed={false} />
              <button
                onClick={onCloseMobile}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={onCloseMobile}>
              <NavLinks links={links} collapsed={false} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}