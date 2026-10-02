import useCountUp from "../../hooks/useCountUp";

export default function StatCard({ label, value, icon: Icon, accent = "navy", suffix = "" }) {
  const theme = {
    navy: { bar: "bg-navy-500", icon: "bg-gradient-to-br from-navy-500 to-navy-700" },
    teal: { bar: "bg-teal-500", icon: "bg-gradient-to-br from-teal-400 to-teal-600" },
    amber: { bar: "bg-amber-500", icon: "bg-gradient-to-br from-amber-400 to-amber-600" },
  };
  const t = theme[accent] || theme.navy;

  const animatedValue = useCountUp(value);

  return (
    <div className="card relative flex items-start justify-between overflow-hidden !pt-6">
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} aria-hidden />
      <div>
        <p className="text-sm font-medium text-navy-400">{label}</p>
        <p key={value} className="count-up mt-1.5 font-display text-2xl font-bold text-navy-900">
          {animatedValue}
          {suffix}
        </p>
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm ${t.icon}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
