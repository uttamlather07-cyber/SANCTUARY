export default function Leaderboard({ entries, scoreKey = "score", maxScore, title = "Leaderboard" }) {
  const sorted = [...entries].sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0));
  const top = maxScore || Math.max(1, ...sorted.map((e) => e[scoreKey] || 0));

  return (
    <div className="w-full">
      <h3 className="font-display font-semibold text-lg mb-4 text-chalk">{title}</h3>
      <div className="space-y-2.5">
        {sorted.length === 0 && (
          <p className="text-slate text-sm py-6 text-center">No scores yet — waiting for answers.</p>
        )}
        {sorted.map((entry, i) => {
          const pct = Math.max(4, ((entry[scoreKey] || 0) / top) * 100);
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
          return (
            <div key={entry.id || entry.name} className="flex items-center gap-3">
              <span className="w-6 text-sm font-semibold text-slate text-center shrink-0">
                {medal || i + 1}
              </span>
              <div className="flex-1 relative h-9 bg-ink rounded-lg overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-dim to-amber flex items-center transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                >
                  <span className="pl-3 text-xs font-semibold text-ink truncate">{entry.name}</span>
                </div>
              </div>
              <span className="w-10 text-right font-display font-bold text-sm text-chalk shrink-0">
                {entry[scoreKey] || 0}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
