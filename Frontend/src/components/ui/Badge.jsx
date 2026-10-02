const STYLES = {
  present: "bg-teal-50 text-teal-700",
  paid: "bg-teal-50 text-teal-700",
  approved: "bg-teal-50 text-teal-700",
  resolved: "bg-teal-50 text-teal-700",
  closed: "bg-navy-100 text-navy-600",
  absent: "bg-red-50 text-red-600",
  rejected: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
  partial: "bg-amber-50 text-amber-700",
  open: "bg-amber-50 text-amber-700",
  processing: "bg-amber-50 text-amber-700",
  in_progress: "bg-amber-50 text-amber-700",
  late: "bg-amber-50 text-amber-700",
  half_day: "bg-amber-50 text-amber-700",
  submitted: "bg-teal-50 text-teal-700",
  in_review: "bg-amber-50 text-amber-700",
  active: "bg-teal-50 text-teal-700",
  inactive: "bg-navy-100 text-navy-600",
};

export default function Badge({ status }) {
  const style = STYLES[status] || "bg-navy-100 text-navy-600";
  const label = status?.replace(/_/g, " ");
  return <span className={`badge capitalize ${style}`}>{label}</span>;
}
