import { useState } from "react";
import { Button, Card, Input, Spinner } from "../components/ui";
import { getSession } from "../api/quizData";

export default function StudentJoin({ initialCode = "", onJoin }) {
  const [step, setStep] = useState(initialCode ? "name" : "code");
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [sessionPreview, setSessionPreview] = useState(null);

  async function handleCodeSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length !== 4) {
      setError("Enter the 4-digit code your teacher shared.");
      return;
    }
    setError("");
    setChecking(true);
    try {
      const session = await getSession(trimmed);
      if (!session) {
        setError("No session found with that code. Double-check with your teacher.");
        return;
      }
      if (session.status === "finished") {
        setError("This session has already finished.");
        return;
      }
      setSessionPreview(session);
      setStep("name");
    } catch (err) {
      setError("Couldn't check that code. " + err.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter your name so your teacher and classmates can see you.");
      return;
    }
    setError("");
    setJoining(true);
    try {
      await onJoin(code.trim(), trimmed);
    } catch (err) {
      setError("Couldn't join the session. " + err.message);
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink">
      <div className="w-full max-w-sm animate-popIn">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-amber/15 text-amber font-display font-bold text-xl mb-4">
            Q
          </div>
          <h1 className="font-display font-bold text-2xl text-chalk">
            {step === "code" ? "Join a session" : "What's your name?"}
          </h1>
          <p className="text-slate text-sm mt-1.5">
            {step === "code"
              ? "Enter the room code your teacher shared with the class."
              : sessionPreview?.quizSnapshot?.title || "This will show on the leaderboard."}
          </p>
        </div>

        <Card>
          {step === "code" ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <Input
                label="Room code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setError("");
                }}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                className="text-center text-3xl font-display font-bold tracking-[0.3em] py-4"
              />
              {error && <p className="text-wrong text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={checking}>
                {checking ? (
                  <>
                    <Spinner size={16} /> Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <Input
                label="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Aarav Sharma"
                autoFocus
                maxLength={40}
              />
              {error && <p className="text-wrong text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={joining}>
                {joining ? (
                  <>
                    <Spinner size={16} /> Joining...
                  </>
                ) : (
                  "Join session"
                )}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("code");
                  setError("");
                }}
                className="w-full text-center text-slate text-sm hover:text-chalk"
              >
                ← Use a different code
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
