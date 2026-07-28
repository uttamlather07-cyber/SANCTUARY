/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Base surfaces — deep ink, not pure black, so text and cards have room to breathe
        ink: "#0F1115",
        "ink-light": "#171A21",
        "ink-lighter": "#1F232C",
        // Text
        chalk: "#F4F3EF",
        slate: "#8B92A3",
        // Accent — warm amber, exam-hall lamp light. Used sparingly, for action + focus.
        amber: "#FFB627",
        "amber-dim": "#E5A423",
        // Signal colors
        correct: "#3DDC84",
        wrong: "#FF5C5C",
        info: "#5B9DFF",
      },
      fontFamily: {
        display: ["'Fraunces'", "ui-serif", "Georgia", "serif"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        widest2: "0.18em",
      },
      keyframes: {
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(61,220,132,0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(61,220,132,0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        popIn: "popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        pulseGlow: "pulseGlow 1.6s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        slideUp: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
