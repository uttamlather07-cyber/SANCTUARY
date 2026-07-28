// Shared UI primitives.
// Existing components keep their original prop API so every page that already
// imports { Button, Card, Input, Badge, RoomCodeDisplay } keeps working unchanged.

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
  size = "md",
  icon = null,
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap";
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  const variants = {
    primary:
      "bg-amber text-ink hover:bg-amber-dim shadow-[0_4px_0_0_#C98F1C] active:shadow-[0_1px_0_0_#C98F1C] active:translate-y-[3px]",
    secondary: "bg-ink-lighter text-chalk hover:bg-ink-light border border-white/10",
    ghost: "text-slate hover:text-chalk hover:bg-white/5",
    danger: "bg-wrong/15 text-wrong hover:bg-wrong/25 border border-wrong/30",
    success:
      "bg-correct text-ink hover:brightness-95 shadow-[0_4px_0_0_#2AA862] active:shadow-[0_1px_0_0_#2AA862] active:translate-y-[3px]",
    outline: "border-2 border-white/15 text-chalk hover:border-amber/50 hover:text-amber bg-transparent",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ children, className = "", as: As = "div", ...rest }) {
  return (
    <As className={`bg-ink-light border border-white/5 rounded-2xl p-6 ${className}`} {...rest}>
      {children}
    </As>
  );
}

export function Input({ label, hint, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-slate mb-1.5 font-medium">{label}</span>}
      <input
        className={`w-full bg-ink border rounded-xl px-4 py-3 text-chalk placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-amber/40 transition-colors ${
          error ? "border-wrong" : "border-white/10 focus:border-amber"
        } ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-slate/70 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-wrong mt-1.5">{error}</span>}
    </label>
  );
}

export function Textarea({ label, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-slate mb-1.5 font-medium">{label}</span>}
      <textarea
        className={`w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-chalk placeholder:text-slate/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/40 transition-colors font-mono text-sm leading-relaxed ${className}`}
        {...props}
      />
      {hint && <span className="block text-xs text-slate/70 mt-1.5">{hint}</span>}
    </label>
  );
}

export function Select({ label, hint, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-slate mb-1.5 font-medium">{label}</span>}
      <select
        className={`w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-chalk focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/40 transition-colors appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && <span className="block text-xs text-slate/70 mt-1.5">{hint}</span>}
    </label>
  );
}

export function Badge({ children, tone = "default", className = "" }) {
  const tones = {
    default: "bg-white/5 text-slate border-white/10",
    live: "bg-wrong/15 text-wrong border-wrong/30",
    amber: "bg-amber/15 text-amber border-amber/30",
    correct: "bg-correct/15 text-correct border-correct/30",
    info: "bg-info/15 text-info border-info/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function RoomCodeDisplay({ code }) {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <span className="text-xs uppercase tracking-widest2 text-slate font-semibold">Room code</span>
      <div className="flex gap-2">
        {code.split("").map((digit, i) => (
          <div
            key={i}
            className="w-14 h-16 sm:w-16 sm:h-20 flex items-center justify-center bg-ink border-2 border-amber/40 rounded-xl text-4xl sm:text-5xl font-display font-bold text-amber"
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- New primitives added for the professional-dashboard redesign ----------

export function ProgressBar({ value, max = 100, className = "", tone = "amber" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    amber: "bg-amber",
    correct: "bg-correct",
    wrong: "bg-wrong",
    info: "bg-info",
  };
  return (
    <div className={`w-full h-1.5 bg-white/5 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${tones[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StatPill({ label, value, tone = "default" }) {
  const tones = {
    default: "text-chalk",
    correct: "text-correct",
    wrong: "text-wrong",
    amber: "text-amber",
  };
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2">
      <span className={`font-display font-bold text-xl ${tones[tone]}`}>{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-slate font-semibold">{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <Card className="text-center py-14 px-6">
      {icon && <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 text-2xl">{icon}</div>}
      <h3 className="font-display font-semibold text-lg text-chalk mb-1.5">{title}</h3>
      {description && <p className="text-slate text-sm max-w-sm mx-auto mb-6">{description}</p>}
      {action}
    </Card>
  );
}

export function IconChip({ children, tone = "default" }) {
  const tones = {
    default: "bg-white/5 text-slate",
    amber: "bg-amber/15 text-amber",
    correct: "bg-correct/15 text-correct",
    wrong: "bg-wrong/15 text-wrong",
    info: "bg-info/15 text-info",
  };
  return (
    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-display font-bold ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <Card className="relative w-full max-w-md animate-popIn max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg text-chalk">{title}</h3>
          <button onClick={onClose} className="text-slate hover:text-chalk text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">
            &times;
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </Card>
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <svg className="animate-spin text-amber" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
