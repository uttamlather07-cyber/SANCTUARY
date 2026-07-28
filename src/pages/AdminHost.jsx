import { useEffect, useState } from "react";
import { Button, Card, Badge, RoomCodeDisplay, StatPill } from "../components/ui";
import Leaderboard from "../components/Leaderboard";
import OptionTallyReveal from "../components/OptionTallyReveal";
import {
  subscribeSession,
  subscribeParticipants,
  subscribeTally,
  startSession,
  advanceQuestion,
  revealQuestion,
  finishSession,
} from "../api/quizData";

export default function AdminHost({ code, onExit }) {
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [tally, setTally] = useState({});
  const [copied, setCopied] = useState(false);

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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-slate">Loading session...</p>
      </div>
    );
  }

  const quiz = session.quizSnapshot;
  const qIndex = session.currentQuestionIndex;
  const currentQuestion = quiz.questions[qIndex];
  const isLastQuestion = qIndex === quiz.questions.length - 1;
  const joinUrl = `${window.location.origin}${window.location.pathname}#/join/${code}`;

  async function handleStart() {
    await startSession(code);
  }
  async function handleReveal() {
    await revealQuestion(code);
  }
  async function handleNext() {
    if (isLastQuestion) await finishSession(code);
    else await advanceQuestion(code, qIndex + 1);
  }
  function handleCopyLink() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge tone={session.status === "finished" ? "default" : "live"}>
            {session.status === "lobby"
              ? "Waiting to start"
              : session.status === "finished"
              ? "Finished"
              : `${quiz.mode === "live" ? "Live" : "Test"} in progress`}
          </Badge>
          <Button variant="ghost" onClick={onExit}>Exit</Button>
        </div>

        {session.status === "lobby" && (
          <Card className="text-center py-10 space-y-6 animate-popIn">
            <div>
              <h1 className="font-display font-bold text-2xl text-chalk mb-1">{quiz.title}</h1>
              <p className="text-slate text-sm">Share the code or link with your students to join.</p>
            </div>
            <div className="flex justify-center">
              <RoomCodeDisplay code={code} />
            </div>
            <button
              onClick={handleCopyLink}
              className="text-slate text-xs break-all hover:text-amber transition-colors underline decoration-dotted underline-offset-4"
            >
              {copied ? "Link copied!" : joinUrl}
            </button>
            <div className="pt-2">
              <span className="text-sm text-slate">{participants.length} joined</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {participants.map((p) => (
                <span key={p.id} className="px-3 py-1.5 bg-ink rounded-full text-sm border border-white/10 text-chalk">
                  {p.name}
                </span>
              ))}
            </div>
            <Button onClick={handleStart} disabled={participants.length === 0}>
              Start {quiz.mode === "live" ? "quiz" : "test"}
            </Button>
          </Card>
        )}

        {session.status === "active" && quiz.mode === "live" && (
          <Card className="space-y-5 animate-popIn">
            <div className="flex items-center justify-between">
              <Badge>Question {qIndex + 1} of {quiz.questions.length}</Badge>
              <span className="text-sm text-slate">{Object.values(tally).reduce((a, b) => a + b, 0)} answered</span>
            </div>
            <h2 className="font-display font-semibold text-xl text-chalk">{currentQuestion.text}</h2>
            <OptionTallyReveal
              options={currentQuestion.options}
              counts={tally}
              correctIndex={currentQuestion.correctIndex}
              revealed={false}
            />
            <div className="flex justify-end">
              <Button onClick={handleReveal}>Reveal answer</Button>
            </div>
          </Card>
        )}

        {session.status === "question_reveal" && (
          <Card className="space-y-5 animate-popIn">
            <Badge>Question {qIndex + 1} of {quiz.questions.length}</Badge>
            <h2 className="font-display font-semibold text-xl text-chalk">{currentQuestion.text}</h2>
            <OptionTallyReveal
              options={currentQuestion.options}
              counts={tally}
              correctIndex={currentQuestion.correctIndex}
              revealed={true}
            />
            <div className="flex justify-end">
              <Button onClick={handleNext}>{isLastQuestion ? "Finish quiz" : "Next question"}</Button>
            </div>
          </Card>
        )}

        {session.status === "active" && quiz.mode === "test" && (
          <Card className="text-center py-10 space-y-5">
            <h2 className="font-display font-semibold text-xl text-chalk">Test in progress</h2>
            <p className="text-slate text-sm max-w-md mx-auto">
              Students are working through {quiz.questions.length} questions within their{" "}
              {Math.round(quiz.totalTestSeconds / 60)}-minute budget.
            </p>
            <div className="flex justify-center divide-x divide-white/5">
              <StatPill label="Joined" value={participants.length} />
              <StatPill
                label="Submitted"
                value={participants.filter((p) => p.attempts > 0).length}
                tone="correct"
              />
            </div>
            <Button onClick={() => finishSession(code)} variant="secondary">
              End test for everyone
            </Button>
          </Card>
        )}

        {(session.status === "active" || session.status === "question_reveal" || session.status === "finished") && (
          <Card>
            <Leaderboard
              entries={participants.map((p) => ({ id: p.id, name: p.name, score: p.bestScore || 0 }))}
              title={session.status === "finished" ? "Final leaderboard" : "Live leaderboard"}
            />
          </Card>
        )}

        {session.status === "finished" && (
          <div className="flex justify-center">
            <Button onClick={onExit}>Back to dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
}
