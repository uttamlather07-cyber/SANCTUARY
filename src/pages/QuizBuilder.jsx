import { useState } from "react";
import { Button, Card, Input, Select, Textarea, Badge, IconChip } from "../components/ui";
import { createQuiz, updateQuiz, parseBulkQuestions } from "../api/quizData";

const emptyQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  solution: "",
});

export default function QuizBuilder({ existingQuiz, onCreated, onCancel }) {
  const isEditing = !!existingQuiz;

  const [title, setTitle] = useState(existingQuiz?.title || "");
  const [mode, setMode] = useState(existingQuiz?.mode || "live");
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(existingQuiz?.perQuestionSeconds || 30);
  const [totalTestMinutes, setTotalTestMinutes] = useState(
    existingQuiz ? Math.round((existingQuiz.totalTestSeconds || 600) / 60) : 10
  );
  const [questions, setQuestions] = useState(existingQuiz?.questions || []);
  const [bulkText, setBulkText] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [importNote, setImportNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleBulkImport() {
    const { questions: parsed, skipped } = parseBulkQuestions(bulkText);
    if (parsed.length === 0) {
      setImportNote("No questions recognized. Check the format and try again.");
      return;
    }
    setQuestions([...questions, ...parsed]);
    setBulkText("");
    setActiveTab("manual");
    setImportNote(
      `Imported ${parsed.length} question${parsed.length === 1 ? "" : "s"}` +
        (skipped ? ` — ${skipped} block${skipped === 1 ? "" : "s"} skipped (missing question text or options).` : ".")
    );
  }

  function updateQuestion(index, patch) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex, oIndex, value) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q))
    );
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
    setActiveTab("manual");
  }

  function removeQuestion(index) {
    setQuestions((qs) => qs.filter((_, i) => i !== index));
  }

  function moveQuestion(index, dir) {
    setQuestions((qs) => {
      const next = [...qs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const validQuestions = questions.filter(
    (q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2
  );
  const canSave = title.trim() && validQuestions.length > 0;

  async function handleSave() {
    if (!canSave) {
      setError("Add a title and at least one complete question (question text + 2 options) before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        mode,
        perQuestionSeconds: Number(perQuestionSeconds) || 30,
        totalTestSeconds: (Number(totalTestMinutes) || 10) * 60,
        questions: validQuestions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()),
          correctIndex: q.correctIndex,
          solution: (q.solution || "").trim(),
        })),
      };
      if (isEditing) {
        await updateQuiz(existingQuiz.id, payload);
      } else {
        await createQuiz(payload);
      }
      onCreated();
    } catch (e) {
      setError("Couldn't save quiz. " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-ink/95 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onCancel}
              className="text-slate hover:text-chalk shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5"
              aria-label="Back"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-lg text-chalk truncate">
                {isEditing ? "Edit quiz" : "Create new quiz"}
              </h1>
              <p className="text-xs text-slate">{validQuestions.length} question{validQuestions.length === 1 ? "" : "s"} ready</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !canSave}>
              {saving ? "Saving..." : isEditing ? "Save changes" : "Save quiz"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-wrong/10 border border-wrong/30 text-wrong text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Setup card */}
        <Card className="space-y-5">
          <h2 className="font-display font-semibold text-base text-chalk">Quiz setup</h2>
          <Input
            label="Quiz title"
            placeholder="e.g. Physics — Chapter 1: Kinematics"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <span className="block text-sm text-slate mb-2 font-medium">Format</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeOption
                selected={mode === "live"}
                onClick={() => setMode("live")}
                title="Live quiz"
                description="Everyone answers the same question together, synced timer, results revealed as a class."
                emoji="⚡"
              />
              <ModeOption
                selected={mode === "test"}
                onClick={() => setMode("test")}
                title="Self-paced test"
                description="Students work through questions on their own within a total time budget."
                emoji="📝"
              />
            </div>
          </div>

          {mode === "live" ? (
            <Input
              type="number"
              min={5}
              label="Seconds per question"
              value={perQuestionSeconds}
              onChange={(e) => setPerQuestionSeconds(e.target.value)}
              hint="Every student sees the same countdown for each question."
              className="max-w-[200px]"
            />
          ) : (
            <Input
              type="number"
              min={1}
              label="Total test time (minutes)"
              value={totalTestMinutes}
              onChange={(e) => setTotalTestMinutes(e.target.value)}
              hint="Students can move between questions freely until time runs out."
              className="max-w-[200px]"
            />
          )}
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/5">
          <TabButton active={activeTab === "manual"} onClick={() => setActiveTab("manual")}>
            Questions ({questions.length})
          </TabButton>
          <TabButton active={activeTab === "bulk"} onClick={() => setActiveTab("bulk")}>
            Bulk import
          </TabButton>
        </div>

        {activeTab === "bulk" && (
          <Card className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-chalk mb-1">Paste your questions</h3>
              <p className="text-slate text-sm">
                Works with <code className="text-chalk bg-white/5 px-1.5 py-0.5 rounded">Q: / A: / B: / C: / D: / Ans:</code>,
                numbered lists like <code className="text-chalk bg-white/5 px-1.5 py-0.5 rounded">1. ... a) ... b) ...</code>,
                or mark the right option with a trailing <code className="text-chalk bg-white/5 px-1.5 py-0.5 rounded">*</code>.
                Separate questions with a blank line.
              </p>
            </div>
            <Textarea
              rows={12}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Q: What is the unit of force?\nA: Joule\nB: Newton\nC: Watt\nD: Pascal\nAns: B\n\n1. What is the boiling point of water at sea level?\na) 90°C\nb) 100°C *\nc) 110°C\nd) 120°C`}
            />
            {importNote && <p className="text-sm text-slate">{importNote}</p>}
            <Button onClick={handleBulkImport} disabled={!bulkText.trim()}>
              Parse & add questions
            </Button>
          </Card>
        )}

        {activeTab === "manual" && (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <Card className="text-center py-14">
                <p className="text-slate mb-4">No questions yet. Add one manually or paste a batch in Bulk import.</p>
                <div className="flex justify-center gap-3">
                  <Button onClick={addQuestion}>+ Add question</Button>
                  <Button variant="secondary" onClick={() => setActiveTab("bulk")}>Bulk import</Button>
                </div>
              </Card>
            ) : (
              <>
                {questions.map((q, qIndex) => (
                  <QuestionEditor
                    key={qIndex}
                    index={qIndex}
                    total={questions.length}
                    question={q}
                    onChange={(patch) => updateQuestion(qIndex, patch)}
                    onOptionChange={(oIndex, value) => updateOption(qIndex, oIndex, value)}
                    onRemove={() => removeQuestion(qIndex)}
                    onMoveUp={() => moveQuestion(qIndex, -1)}
                    onMoveDown={() => moveQuestion(qIndex, 1)}
                  />
                ))}
                <Button variant="secondary" onClick={addQuestion} className="w-full">
                  + Add another question
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeOption({ selected, onClick, title, description, emoji }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all ${
        selected ? "border-amber bg-amber/10" : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <span className="font-display font-semibold text-chalk">{title}</span>
      </div>
      <p className="text-slate text-xs leading-relaxed">{description}</p>
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
        active ? "border-amber text-chalk" : "border-transparent text-slate hover:text-chalk"
      }`}
    >
      {children}
    </button>
  );
}

const LABELS = ["A", "B", "C", "D"];

function QuestionEditor({ index, total, question, onChange, onOptionChange, onRemove, onMoveUp, onMoveDown }) {
  const isComplete = question.text.trim() && question.options.filter((o) => o.trim()).length >= 2;

  return (
    <Card className="space-y-4 animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconChip tone={isComplete ? "correct" : "default"}>{index + 1}</IconChip>
          {!isComplete && <Badge tone="default">Incomplete</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate hover:text-chalk hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate hover:text-chalk hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate hover:text-wrong hover:bg-wrong/10"
            aria-label="Delete question"
          >
            ✕
          </button>
        </div>
      </div>

      <Textarea
        rows={2}
        value={question.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Question text"
        className="font-sans text-base"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((opt, oIndex) => (
          <div key={oIndex} className="flex items-center gap-2">
            <button
              onClick={() => onChange({ correctIndex: oIndex })}
              className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-display font-bold text-sm border-2 transition-colors ${
                question.correctIndex === oIndex
                  ? "bg-correct border-correct text-ink"
                  : "border-white/15 text-slate hover:border-white/30"
              }`}
              title="Mark as correct answer"
            >
              {LABELS[oIndex]}
            </button>
            <input
              value={opt}
              onChange={(e) => onOptionChange(oIndex, e.target.value)}
              placeholder={`Option ${LABELS[oIndex]}`}
              className="flex-1 bg-ink border border-white/10 rounded-xl px-3 py-2.5 text-chalk placeholder:text-slate/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/40 transition-colors text-sm"
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate/70">Click a letter to mark the correct answer.</p>

      <Textarea
        rows={2}
        value={question.solution}
        onChange={(e) => onChange({ solution: e.target.value })}
        placeholder="Explanation (optional) — shown to students after they answer"
        className="font-sans text-sm"
      />
    </Card>
  );
}
