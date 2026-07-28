import { useEffect, useState } from "react";
import { Button, Card, Badge, EmptyState, IconChip, Modal } from "../components/ui";
import { listQuizzes, deleteQuiz, createSession } from "../api/quizData";

export default function AdminDashboard({ onCreateNew, onEdit, onLaunched, onLogout }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launchingId, setLaunchingId] = useState(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const list = await listQuizzes();
      setQuizzes(list);
    } catch (e) {
      setError("Couldn't load quizzes — check your Firebase setup. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunch(quiz) {
    setLaunchingId(quiz.id);
    try {
      const code = await createSession(quiz.id, quiz);
      onLaunched(code);
    } catch (e) {
      setError("Couldn't start session. " + e.message);
    } finally {
      setLaunchingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteQuiz(confirmDelete.id);
      setConfirmDelete(null);
      refresh();
    } catch (e) {
      setError("Couldn't delete quiz. " + e.message);
    } finally {
      setDeleting(false);
    }
  }

  const liveCount = quizzes.filter((q) => q.mode === "live").length;
  const testCount = quizzes.filter((q) => q.mode === "test").length;
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber/15 text-amber font-display font-bold">
                Q
              </div>
              <h1 className="font-display font-bold text-2xl text-chalk">Your quizzes</h1>
            </div>
            <p className="text-slate text-sm">Create, launch, and manage live quizzes and tests.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" onClick={onLogout}>Log out</Button>
            <Button onClick={onCreateNew}>+ New quiz</Button>
          </div>
        </div>

        {/* Stat strip */}
        {quizzes.length > 0 && (
          <div className="grid grid-cols-3 divide-x divide-white/5 bg-ink-light border border-white/5 rounded-2xl overflow-hidden">
            <StatBlock value={quizzes.length} label="Total quizzes" />
            <StatBlock value={liveCount} label="Live format" tone="amber" />
            <StatBlock value={testCount} label="Test format" tone="info" />
          </div>
        )}

        {error && <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-xl px-4 py-3">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-ink-light border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No quizzes yet"
            description="Create your first quiz — paste a question bank or build one question at a time."
            action={<Button onClick={onCreateNew}>+ New quiz</Button>}
          />
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <IconChip tone={quiz.mode === "live" ? "amber" : "info"}>
                    {quiz.mode === "live" ? "⚡" : "📝"}
                  </IconChip>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-semibold text-lg text-chalk truncate">{quiz.title}</h3>
                      <Badge tone={quiz.mode === "live" ? "amber" : "info"}>
                        {quiz.mode === "live" ? "Live Quiz" : "Self-paced Test"}
                      </Badge>
                    </div>
                    <p className="text-slate text-sm">
                      {quiz.questions?.length || 0} question{quiz.questions?.length === 1 ? "" : "s"} ·{" "}
                      {quiz.mode === "live"
                        ? `${quiz.perQuestionSeconds}s per question`
                        : `${Math.round(quiz.totalTestSeconds / 60)} min total`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(quiz)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => setConfirmDelete(quiz)}>Delete</Button>
                  <Button size="sm" onClick={() => handleLaunch(quiz)} disabled={launchingId === quiz.id}>
                    {launchingId === quiz.id ? "Starting..." : "Launch"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this quiz?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete quiz"}
            </Button>
          </>
        }
      >
        <p className="text-slate text-sm">
          <span className="text-chalk font-medium">{confirmDelete?.title}</span> will be permanently removed. This can't be undone.
        </p>
      </Modal>
    </div>
  );
}

function StatBlock({ value, label, tone = "default" }) {
  const tones = { default: "text-chalk", amber: "text-amber", info: "text-info" };
  return (
    <div className="px-6 py-5 text-center">
      <div className={`font-display font-bold text-2xl ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-slate uppercase tracking-wide font-semibold mt-0.5">{label}</div>
    </div>
  );
}
