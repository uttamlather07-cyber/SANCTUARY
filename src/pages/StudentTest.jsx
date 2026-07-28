import { useEffect, useRef, useState } from "react";
import { Button, Card, Badge, ProgressBar } from "../components/ui";
import Leaderboard from "../components/Leaderboard";
import {
  subscribeSession,
  subscribeParticipants,
  createAttempt,
  finalizeAttempt,
} from "../api/quizData";

const LABELS = ["A", "B", "C", "D"];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function StudentTest({ code, participantId, studentName, onDone }) {
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [attemptId, setAttemptId] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qIndex]: optionIndex }
  const [flagged, setFlagged] = useState(() => new Set());
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [navOpen, setNavOpen] = useState(true);

  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeSession(code, setSession);
    const unsubP = subscribeParticipants(code, setParticipants);
    return () => {
      unsub();
      unsubP();
    };
  }, [code]);

  useEffect(() => {
    if (session?.status === "active" && !attemptId) {
      createAttempt(code, participantId, studentName).then(setAttemptId);
      startedAtRef.current = Date.now();
    }
  }, [session?.status]);

  useEffect(() => {
    if (session?.status !== "active" || submitted) return;
    const total = session.quizSnapshot?.totalTestSeconds || 600;
    clearInterval(timerRef.current);
    const start = startedAtRef.current || Date.now();

    function tick() {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, Math.ceil(total - elapsed));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current);
        handleSubmit();
      }
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.status, submitted]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-slate">Connecting to session...</p>
      </div>
    );
  }

  const quiz = session.quizSnapshot;

  function toggleFlag(index) {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function selectAnswer(index, optionIndex) {
    setAnswers((prev) => ({ ...prev, [index]: optionIndex }));
  }

  async function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    if (!attemptId) return;
    const answerList = quiz.questions.map((q, i) => ({
      questionIndex: i,
      selectedIndex: answers[i] ?? null,
      correct: answers[i] === q.correctIndex,
    }));
    const correctCount = answerList.filter((a) => a.correct).length;
    await finalizeAttempt(code, attemptId, participantId, correctCount, quiz.questions.length, answerList);
  }

  // ---------- Lobby ----------
  if (session.status === "lobby") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink">
        <Card className="w-full max-w-lg text-center py-12 px-6 space-y-6 animate-popIn">
          <Badge tone="info">Waiting for host</Badge>
          <h1 className="font-display font-bold text-3xl text-chalk">You're in, {studentName}!</h1>
          <p className="text-slate">Your test will begin as soon as the host starts it.</p>
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs uppercase tracking-wide text-slate font-semibold mb-3">
              {participants.length} students joined
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto">
              {participants.map((p) => (
                <span key={p.id} className="px-3 py-1.5 bg-ink rounded-full text-sm border border-white/10 text-chalk">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ---------- Submitted / results ----------
  if (submitted || session.status === "finished") {
    const answerList = quiz.questions.map((q, i) => ({
      questionIndex: i,
      selectedIndex: answers[i] ?? null,
      correct: answers[i] === q.correctIndex,
    }));
    const score = answerList.filter((a) => a.correct).length;

    return (
      <div className="min-h-screen bg-ink p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="text-center py-10 space-y-3 animate-popIn">
            <h1 className="font-display font-bold text-5xl text-chalk">
              {score} <span className="text-slate text-2xl">/ {quiz.questions.length}</span>
            </h1>
            <p className="text-slate">Test complete. Nice work, {studentName}.</p>
          </Card>

          <Card>
            <Leaderboard
              entries={participants.map((p) => ({ id: p.id, name: p.name, score: p.bestScore || 0 }))}
              title="Leaderboard"
            />
          </Card>

          <div className="space-y-4">
            <h2 className="font-display font-semibold text-lg text-chalk px-1">Review answers</h2>
            {quiz.questions.map((q, i) => {
              const picked = answers[i];
              return (
                <Card key={i} className="space-y-3">
                  <p className="font-medium text-chalk">
                    <span className="text-slate mr-2">Q{i + 1}.</span>
                    {q.text}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIndex) => {
                      let cls = "border-white/10 text-slate";
                      if (oIndex === q.correctIndex) cls = "border-correct bg-correct/10 text-correct";
                      else if (picked === oIndex) cls = "border-wrong bg-wrong/10 text-wrong";
                      return (
                        <div key={oIndex} className={`px-3 py-2 rounded-lg border text-sm ${cls}`}>
                          <span className="font-bold mr-2">{LABELS[oIndex]}.</span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                  {q.solution && (
                    <p className="text-sm text-slate bg-white/5 rounded-lg px-3 py-2">{q.solution}</p>
                  )}
                </Card>
              );
            })}
          </div>

          <Button className="w-full" onClick={onDone}>Exit</Button>
        </div>
      </div>
    );
  }

  // ---------- Active test ----------
  const currentQ = quiz.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const total = quiz.questions.length;
  const urgent = secondsLeft !== null && secondsLeft <= 60;

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-ink/95 backdrop-blur border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-chalk truncate text-sm sm:text-base">{quiz.title}</h1>
          <ProgressBar value={answeredCount} max={total} className="mt-1.5 w-40 sm:w-56" />
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-display font-bold shrink-0 ${
            urgent ? "bg-wrong/15 border-wrong/30 text-wrong" : "bg-white/5 border-white/10 text-chalk"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${urgent ? "bg-wrong animate-pulse" : "bg-amber"}`} />
          {secondsLeft !== null ? formatTime(secondsLeft) : "--:--"}
        </div>
      </div>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Question panel */}
        <div className="flex-1 p-4 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Badge>Question {currentIndex + 1} of {total}</Badge>
            <button
              onClick={() => toggleFlag(currentIndex)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                flagged.has(currentIndex)
                  ? "bg-amber/15 border-amber/40 text-amber"
                  : "border-white/10 text-slate hover:text-chalk"
              }`}
            >
              {flagged.has(currentIndex) ? "★ Flagged for review" : "☆ Flag for review"}
            </button>
          </div>

          <Card className="space-y-6">
            <h2 className="font-display font-semibold text-xl text-chalk leading-snug">{currentQ.text}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(currentIndex, i)}
                  className={`text-left flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all ${
                    answers[currentIndex] === i
                      ? "border-amber bg-amber/10 text-chalk"
                      : "border-white/10 text-chalk hover:border-white/25"
                  }`}
                >
                  <span
                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${
                      answers[currentIndex] === i ? "bg-amber text-ink" : "bg-white/5 text-slate"
                    }`}
                  >
                    {LABELS[i]}
                  </span>
                  <span className="font-medium text-sm sm:text-base">{opt}</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
              ← Previous
            </Button>
            {currentIndex === total - 1 ? (
              <Button variant="success" onClick={handleSubmit}>Submit test</Button>
            ) : (
              <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next →</Button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div className={`hidden lg:block border-l border-white/5 transition-all ${navOpen ? "w-64" : "w-0 overflow-hidden"}`}>
          <div className="p-5 sticky top-[57px]">
            <div className="flex justify-between text-xs mb-4">
              <StatChip label="Answered" value={answeredCount} tone="correct" />
              <StatChip label="Flagged" value={flagged.size} tone="amber" />
              <StatChip label="Left" value={total - answeredCount} tone="default" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {quiz.questions.map((_, i) => {
                const isAnswered = answers[i] !== undefined;
                const isFlagged = flagged.has(i);
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`relative aspect-square rounded-lg text-sm font-semibold flex items-center justify-center border-2 transition-colors ${
                      isCurrent
                        ? "border-amber text-chalk"
                        : isAnswered
                        ? "border-correct/40 bg-correct/10 text-correct"
                        : "border-white/10 text-slate hover:border-white/25"
                    }`}
                  >
                    {i + 1}
                    {isFlagged && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav toggle */}
      <button
        onClick={() => setNavOpen((o) => !o)}
        className="lg:hidden fixed bottom-4 right-4 w-11 h-11 rounded-full bg-ink-lighter border border-white/10 text-chalk flex items-center justify-center shadow-lg"
      >
        ⠿
      </button>
    </div>
  );
}

function StatChip({ label, value, tone }) {
  const tones = { correct: "text-correct", amber: "text-amber", default: "text-slate" };
  return (
    <div className="text-center">
      <div className={`font-display font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-slate/70">{label}</div>
    </div>
  );
}
