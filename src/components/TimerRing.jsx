export default function TimerRing({ secondsLeft, totalSeconds, size = 72 }) {
  const pct = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const urgent = secondsLeft <= 5;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={urgent ? "#FF5C5C" : "#FFB627"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-display font-bold text-xl ${urgent ? "text-wrong" : "text-chalk"}`}>
          {secondsLeft}
        </span>
      </div>
    </div>
  );
}
