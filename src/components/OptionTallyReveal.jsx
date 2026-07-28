const LABELS = ["A", "B", "C", "D"];

export default function OptionTallyReveal({ options, counts, correctIndex, revealed }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const count = counts[i] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const isCorrect = revealed && i === correctIndex;
        const isWrongPicked = revealed && i !== correctIndex && count > 0;

        return (
          <div
            key={i}
            className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${
              isCorrect
                ? "border-correct animate-pulseGlow"
                : revealed
                ? "border-white/5"
                : "border-white/10"
            }`}
          >
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                isCorrect ? "bg-correct/25" : revealed ? "bg-wrong/10" : "bg-amber/15"
              }`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center gap-3 px-4 py-3.5">
              <span
                className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
                  isCorrect ? "bg-correct text-ink" : "bg-white/10 text-chalk"
                }`}
              >
                {LABELS[i] || i + 1}
              </span>
              <span className="flex-1 font-medium text-chalk">{opt}</span>
              {revealed && (
                <span className={`font-display font-bold text-sm ${isCorrect ? "text-correct" : "text-slate"}`}>
                  {count} {count === 1 ? "vote" : "votes"}
                </span>
              )}
              {isCorrect && <span className="text-correct text-lg">✓</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
