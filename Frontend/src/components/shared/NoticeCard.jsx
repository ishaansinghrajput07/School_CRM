import { Trash2, Pencil, Calendar, Users, Crown, UserCheck } from "lucide-react";

// Small "who this is from" badge shown on every notice card so a student
// can tell a Principal's announcement apart from their own class teacher's
// at a glance, without opening it.
const SOURCE_LABEL = {
  principal: { label: "Principal's Desk", icon: Crown, className: "bg-violet-100 text-violet-700" },
  class_teacher: { label: "Class Teacher", icon: UserCheck, className: "bg-sky-100 text-sky-700" },
};

// Full literal class strings per color (never string-concatenated) so
// Tailwind's JIT scanner can find and keep them at build time.
export const NOTICE_COLORS = {
  teal: {
    label: "Teal",
    swatch: "bg-teal-500",
    bar: "bg-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-700",
    badge: "bg-teal-100 text-teal-700",
  },
  amber: {
    label: "Amber",
    swatch: "bg-amber-500",
    bar: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  rose: {
    label: "Rose",
    swatch: "bg-rose-500",
    bar: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
  },
  violet: {
    label: "Violet",
    swatch: "bg-violet-500",
    bar: "bg-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
  },
  sky: {
    label: "Sky",
    swatch: "bg-sky-500",
    bar: "bg-sky-500",
    bg: "bg-sky-50",
    text: "text-sky-700",
    badge: "bg-sky-100 text-sky-700",
  },
  emerald: {
    label: "Emerald",
    swatch: "bg-emerald-500",
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
  slate: {
    label: "Slate",
    swatch: "bg-slate-500",
    bar: "bg-slate-500",
    bg: "bg-slate-50",
    text: "text-slate-700",
    badge: "bg-slate-100 text-slate-700",
  },
};

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(NOTICE_COLORS).map(([key, c]) => (
        <button
          type="button"
          key={key}
          onClick={() => onChange(key)}
          title={c.label}
          className={`h-7 w-7 rounded-full ${c.swatch} transition-transform ${
            value === key ? "ring-2 ring-offset-2 ring-navy-900 scale-110" : "hover:scale-105"
          }`}
          aria-label={`Choose ${c.label}`}
        />
      ))}
    </div>
  );
}

export default function NoticeCard({ notice, onEdit, onDelete }) {
  const c = NOTICE_COLORS[notice.color] || NOTICE_COLORS.teal;
  return (
    <div className={`card overflow-hidden !p-0 ${c.bg}`}>
      <div className={`h-1.5 w-full ${c.bar}`} aria-hidden />
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`badge capitalize ${c.badge}`}>{notice.category}</span>
            {SOURCE_LABEL[notice.source] && (
              <span className={`badge inline-flex items-center gap-1 ${SOURCE_LABEL[notice.source].className}`}>
                {(() => {
                  const Icon = SOURCE_LABEL[notice.source].icon;
                  return <Icon size={11} />;
                })()}
                {SOURCE_LABEL[notice.source].label}
              </span>
            )}
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button onClick={() => onEdit(notice)} className="text-navy-300 hover:text-navy-600">
                  <Pencil size={14} />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(notice._id)} className="text-navy-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <h3 className={`font-display font-semibold ${c.text}`}>{notice.title}</h3>
        <p className="mt-1.5 text-sm text-navy-600 line-clamp-4 whitespace-pre-line">{notice.content}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-navy-400">
          {notice.eventDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {new Date(notice.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {notice.targetClasses?.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> {notice.targetClasses.map((c) => c.name).join(", ")}
            </span>
          )}
          <span className="ml-auto">{new Date(notice.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
