export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-3">
        <span className="mt-1 w-1 shrink-0 rounded-full bg-gradient-to-b from-navy-500 to-teal-500" aria-hidden />
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-navy-400">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
