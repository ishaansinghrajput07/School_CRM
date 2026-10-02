import { motion } from "framer-motion";
import { Shimmer } from "./Skeleton";

/**
 * Small chrome-consistent panel used for every "Recent X" / "Upcoming Y"
 * dashboard widget - a title, an optional "View all" link, and either a
 * loading shimmer, an empty state, or the caller's rows.
 */
export default function ListWidget({ title, icon: Icon, viewAllTo, onViewAll, loading, empty, emptyLabel = "Nothing here yet", children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card"
    >
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-500">
              <Icon size={14} />
            </span>
          )}
          <h3 className="font-display text-sm font-semibold text-navy-800">{title}</h3>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-semibold text-teal-600 hover:underline">
            View all
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="h-8 w-8 shrink-0 !rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : empty ? (
        <p className="py-6 text-center text-sm text-navy-300">{emptyLabel}</p>
      ) : (
        <div className="stagger-rows space-y-1">{children}</div>
      )}
    </motion.div>
  );
}
