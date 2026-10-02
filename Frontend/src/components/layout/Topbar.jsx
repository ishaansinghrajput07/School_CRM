import { useMemo, useState } from "react";
import { Bell, LogOut, ChevronDown, Check, User as UserIcon, Menu, Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import Avatar from "../ui/Avatar";
import { NAV_LINKS_BY_ROLE } from "./navLinks";

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const links = NAV_LINKS_BY_ROLE[user?.role] || [];
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return links.filter((l) => l.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, links]);

  const goTo = (to) => {
    navigate(to);
    setQuery("");
    setSearchOpen(false);
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markAsRead(n._id);
    if (n.link) navigate(n.link);
    setBellOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-navy-100 bg-white/90 px-4 backdrop-blur-sm sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="hidden items-center gap-1 text-xs text-navy-300 sm:flex">
            <span className="capitalize">{user?.role}</span>
            <ChevronRight size={12} />
            <span className="text-navy-500">{title}</span>
          </div>
          <h2 className="truncate font-display text-lg font-semibold text-navy-900">{title}</h2>
        </div>
      </div>

      {/* Quick-jump search - filters this role's sidebar sections */}
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
          placeholder="Search sections..."
          className="w-full rounded-lg border border-navy-100 bg-navy-50/60 py-2 pl-9 pr-3 text-sm text-navy-700 placeholder:text-navy-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        {searchOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-11 overflow-hidden rounded-lg border border-navy-100 bg-white shadow-card">
            {results.map(({ to, label, icon: Icon }) => (
              <button
                key={to}
                onMouseDown={() => goTo(to)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-navy-600 hover:bg-navy-50"
              >
                <Icon size={15} className="text-navy-400" /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <button
            onClick={() => { setBellOpen((v) => !v); setMenuOpen(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 w-80 rounded-lg border border-navy-100 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-navy-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-navy-900">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-navy-400">You're all caught up</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`block w-full border-b border-navy-50 px-4 py-3 text-left last:border-0 hover:bg-navy-50 ${!n.isRead ? "bg-teal-50/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      {!n.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
                    </div>
                    <p className="mt-0.5 text-xs text-navy-500">{n.message}</p>
                    <p className="mt-1 text-[11px] text-navy-300">{timeAgo(n.createdAt)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setMenuOpen((v) => !v); setBellOpen(false); }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-navy-50"
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <span className="hidden text-sm font-medium text-navy-700 sm:block">{user?.name}</span>
            <ChevronDown size={14} className="text-navy-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-44 rounded-lg border border-navy-100 bg-white py-1 shadow-card">
              <button
                onClick={() => { setMenuOpen(false); navigate(`/${user?.role}/profile`); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-navy-600 hover:bg-navy-50"
              >
                <UserIcon size={15} /> My Profile
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-navy-600 hover:bg-navy-50"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
