export default function AuthSelect({ id, label, value, onChange, children, icon: Icon }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#1A1D18]">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1D18]" />}
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none rounded-xl border border-[#E7E2D8] bg-[#F3EFE6]/60 py-3.5 pr-9 text-sm text-[#2F3A2F] outline-none transition-all duration-200 hover:border-[#4F7C5A]/30 focus:border-[#4F7C5A]/60 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,124,90,0.10)] ${
            Icon ? "pl-11" : "pl-4"
          }`}
        >
          {children}
        </select>
        <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1A1D18]" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
