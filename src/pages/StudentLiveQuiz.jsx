import { useEffect, useRef, useState } from "react";
import { Button, Card, Badge } from "../components/ui";
import TimerRing from "../components/TimerRing";
import Leaderboard from "../components/Leaderboard";
import {
  subscribeSession,
  subscribeParticipants,
  subscribeTally,
  submitLiveTally,
  createAttempt,
  finalizeAttempt,
} from "../api/quizData";

const LABELS = ["A", "B", "C", "D"];

export default function StudentLiveQuiz({ code, participantId, studentName, onDone }) {
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [tally, setTally] = useState({});
  const [selected, setSelected] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(null);

  const answersRef = useRef([]);
  const answeredQuestionsRef = useRef(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeSession(code, setSession);
    const unsubP = subscribeParticipants(code, setParticipants);
    return () => {
      unsub();
      unsubP();
    };
  }, [code]);

  useEffect(() => {
    if (!session || session.currentQuestionIndex < 0) return;
    const unsub = subscribeTally(code, session.currentQuestionIndex, setTally);
    return () => unsub();
  }, [code, session?.currentQuestionIndex]);

  useEffect(() => {
    if (session?.status === "active" && !attemptId) {
      createAttempt(code, participantId, studentName).then(setAttemptId);
    }
  }, [session?.status]);

  useEffect(() => {
    setSelected(null);
  }, [session?.currentQuestionIndex]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (session?.status !== "active" || !session.questionStartedAt) return;

    const quiz = session.quizSnapshot;
    const perQ = quiz.perQuestionSeconds;
    const startedMs = session.questionStartedAt.toMillis ? session.questionStartedAt.toMillis() : Date.now();

    function tick() {
      const elapsed = (Date.now() - startedMs) / 1000;
      const left = Math.max(0, Math.ceil(perQ - elapsed));
      setSecondsLeft(left);
    }
    tick();
    timerRef.current = setInterval(tick, 250);
    return () => clearInterval(timerRef.current);
  }, [session?.status, session?.currentQuestionIndex, session?.questionStartedAt]);

  useEffect(() => {
    if (session?.status === "finished" && attemptId) {
      const quiz = session.quizSnapshot;
      const correctCount = answersRef.current.filter((a) => a.correct).length;
      finalizeAttempt(code, attemptId, participantId, correctCount, quiz.questions.length, answersRef.current);
    }
  }, [session?.status]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-slate">Connecting to live session...</p>
      </div>
    );
  }

  const quiz = session.quizSnapshot;
  const qIndex = session.currentQuestionIndex;
  const currentQuestion = qIndex >= 0 ? quiz.questions[qIndex] : null;
  const alreadyAnsweredThis = currentQuestion && answeredQuestionsRef.current.has(qIndex);

  async function handleSelect(optIndex) {
    if (alreadyAnsweredThis || session.status !== "active") return;
    setSelected(optIndex);
    answeredQuestionsRef.current.add(qIndex);
    const correct = optIndex === currentQuestion.correctIndex;
    answersRef.current.push({ questionIndex: qIndex, selectedIndex: optIndex, correct });
    await submitLiveTally(code, qIndex, optIndex);
  }

  // ---------- Lobby ----------
  if (session.status === "lobby") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink">
        <Card className="w-full max-w-2xl text-center py-12 px-6 space-y-6 animate-popIn">
          <Badge tone="info">Waiting for host</Badge>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-chalk">You're in, {studentName}!</h1>
          <p className="text-slate text-base sm:text-lg">Sit tight — the quiz will begin shortly.</p>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-correct animate-pulse" />
              <p className="text-sm font-bold text-slate uppercase tracking-wide">
                {participants.length} students joined
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-h-48 overflow-y-auto p-2">
              {participants.map((p) => (
                <span key={p.id} className="px-4 py-2 bg-ink border border-white/10 text-chalk rounded-xl text-sm font-medium">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ---------- Active / reveal ----------
  if (session.status === "active" || session.status === "question_reveal") {
    const timeIsUp = secondsLeft === 0;
    const revealed = session.status === "question_reveal" || timeIsUp;

    return (
      <div className="min-h-screen bg-ink p-4 sm:p-8 md:p-12 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-grow space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-semibold text-slate">
              Question {qIndex + 1} of {quiz.questions.length}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-wrong/10 text-wrong px-3 py-1.5 rounded-full text-sm font-bold border border-wrong/20">
                <span className="w-2 h-2 rounded-full bg-wrong animate-pulse" />
                {participants.length} live
              </div>
              {!revealed && <TimerRing secondsLeft={secondsLeft} totalSeconds={quiz.perQuestionSeconds} size={48} />}
            </div>
          </div>

          <Card className="space-y-8 p-6 sm:p-10">
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-chalk leading-snug">{currentQuestion.text}</h2>

            {revealed ? (
              <div className="space-y-8 animate-fade-in">
                <RevealBlock options={currentQuestion.options} counts={tally} correctIndex={currentQuestion.correctIndex} />
                {currentQuestion.solution && (
                  <div className="bg-info/10 border border-info/20 text-chalk p-5 sm:p-6 rounded-xl text-left">
                    <span className="font-bold block mb-3 text-base sm:text-lg text-info">Solution</span>
                    <p className="whitespace-pre-wrap text-base sm:text-lg leading-relaxed">{currentQuestion.solution}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null || secondsLeft === 0}
                    className={`w-full text-left flex items-center gap-4 px-5 py-5 rounded-xl border-2 transition-all duration-200 ${
                      selected === i
                        ? "border-amber bg-amber/10 text-chalk shadow-sm scale-[1.01]"
                        : "border-white/10 text-chalk hover:border-white/25 disabled:opacity-60"
                    }`}
                  >
                    <span
                      className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-base ${
                        selected === i ? "bg-amber text-ink" : "bg-white/5 text-slate"
                      }`}
                    >
                      {LABELS[i] || i + 1}
                    </span>
                    <span className="font-medium text-base sm:text-lg">{opt}</span>
                  </button>
                ))}
              </div>
            )}
            {selected !== null && !revealed && (
              <div className="text-center mt-6">
                <span className="inline-block bg-white/5 text-slate px-4 py-2 rounded-full text-sm font-medium">
                  Answer locked in. Waiting for time to expire...
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // ---------- Finished ----------
  if (session.status === "finished") {
    const myScore = answersRef.current.filter((a) => a.correct).length;
    return (
      <div className="min-h-screen bg-ink p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card className="text-center py-10 space-y-4">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-chalk">
              {myScore} <span className="text-slate text-3xl">/ {quiz.questions.length}</span>
            </h1>
            <p className="text-slate font-medium text-lg">Quiz complete! Nice work, {studentName}.</p>
          </Card>

          <Card className="p-6">
            <Leaderboard
              entries={participants.map((p) => ({ id: p.id, name: p.name, score: p.bestScore || 0 }))}
              title="Final leaderboard"
            />
          </Card>

          <Button className="w-full" size="lg" onClick={onDone}>
            Exit quiz
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function RevealBlock({ options, counts, correctIndex }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((opt, i) => {
        const count = counts[i] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const isCorrect = i === correctIndex;
        return (
          <div
            key={i}
            className={`relative rounded-xl border-2 overflow-hidden ${isCorrect ? "border-correct bg-correct/10" : "border-white/10"}`}
          >
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${isCorrect ? "bg-correct/15" : "bg-white/5"}`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center gap-4 px-5 py-5">
              <span
                className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-base ${
                  isCorrect ? "bg-correct text-ink" : "bg-white/5 text-slate"
                }`}
              >
                {LABELS[i] || i + 1}
              </span>
              <span className={`flex-1 font-medium text-base sm:text-lg ${isCorrect ? "text-correct" : "text-chalk"}`}>{opt}</span>
              <span className={`font-bold text-base ${isCorrect ? "text-correct" : "text-slate"}`}>
                {count} {count === 1 ? "vote" : "votes"}
              </span>
              {isCorrect && <span className="text-correct text-2xl font-bold ml-2">✓</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
