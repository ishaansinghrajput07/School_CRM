import { useState } from "react";

/**
 * Light-theme floating-label input for the auth pages. Warm off-white
 * background, soft border, sage-green focus glow.
 */
export default function AuthInput({
  id,
  label,
  type = "text",
  icon: Icon,
  value,
  onChange,
  required,
  autoComplete,
  rightAdornment,
  hint,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  // Native <input type="date"> always renders its own browser-drawn
  // "dd-mm-yyyy" placeholder that can't be hidden the way a text input's
  // can - so for date fields the label must always sit in its floated
  // (small, above the border) position, or the two texts overlap.
  const floated = focused || Boolean(value) || type === "date";

  return (
    <div>
      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              focused ? "text-[#4F7C5A]" : "text-[#4A4F45]"
            }`}
          />
        )}
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          className={`peer w-full rounded-xl border bg-[#F3EFE6]/60 py-3.5 text-sm text-[#2F3A2F] outline-none transition-all duration-200 placeholder:text-transparent ${
            Icon ? "pl-11" : "pl-4"
          } ${rightAdornment ? "pr-11" : "pr-4"} ${
            focused ? "border-[#4F7C5A]/60 bg-white shadow-[0_0_0_4px_rgba(79,124,90,0.10)]" : "border-[#E7E2D8] hover:border-[#4F7C5A]/30"
          }`}
          {...rest}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 origin-left select-none text-[#1A1D18] transition-all duration-200 ${
            Icon ? "peer-placeholder-shown:left-11" : ""
          } ${
            floated
              ? "-top-2 scale-[0.78] bg-white px-1.5 text-[#4F7C5A]"
              : "top-1/2 -translate-y-1/2 text-sm"
          }`}
          style={{ left: Icon && !floated ? "2.75rem" : undefined }}
        >
          {label}
        </label>
        {rightAdornment && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightAdornment}</div>}
      </div>
      {hint && <p className="mt-1.5 text-xs text-[#1A1D18]">{hint}</p>}
    </div>
  );
}
