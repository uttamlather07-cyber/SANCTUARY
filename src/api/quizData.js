import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// ---------- Quizzes (question banks / templates) ----------

export async function createQuiz(quiz) {
  const ref = await addDoc(collection(db, "quizzes"), {
    title: quiz.title,
    mode: quiz.mode, // "live" | "test"
    perQuestionSeconds: quiz.perQuestionSeconds || 30,
    totalTestSeconds: quiz.totalTestSeconds || 600,
    questions: quiz.questions,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuiz(quizId, data) {
  await updateDoc(doc(db, "quizzes", quizId), data);
}

export async function deleteQuiz(quizId) {
  await deleteDoc(doc(db, "quizzes", quizId));
}

export async function getQuiz(quizId) {
  const snap = await getDoc(doc(db, "quizzes", quizId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listQuizzes() {
  const snap = await getDocs(collection(db, "quizzes"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// ---------- Sessions (a live "hosting" of a quiz) ----------

function generateRoomCode() {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createSession(quizId, quizSnapshot) {
  const code = generateRoomCode();
  const ref = doc(db, "sessions", code);
  await setDoc(ref, {
    quizId,
    quizSnapshot,
    status: "lobby",
    mode: quizSnapshot.mode,
    currentQuestionIndex: -1,
    questionStartedAt: null,
    createdAt: serverTimestamp(),
  });
  return code;
}

export async function getSession(code) {
  const snap = await getDoc(doc(db, "sessions", code));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeSession(code, callback) {
  return onSnapshot(doc(db, "sessions", code), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function updateSession(code, data) {
  await updateDoc(doc(db, "sessions", code), data);
}

export async function startSession(code) {
  await updateDoc(doc(db, "sessions", code), {
    status: "active",
    currentQuestionIndex: 0,
    questionStartedAt: serverTimestamp(),
  });
}

export async function advanceQuestion(code, nextIndex) {
  await updateDoc(doc(db, "sessions", code), {
    status: "active",
    currentQuestionIndex: nextIndex,
    questionStartedAt: serverTimestamp(),
  });
}

export async function revealQuestion(code) {
  await updateDoc(doc(db, "sessions", code), { status: "question_reveal" });
}

export async function finishSession(code) {
  await updateDoc(doc(db, "sessions", code), { status: "finished" });
}

// ---------- Participants ----------

export async function joinSession(code, studentName, uid) {
  const participantId = `${uid}`;
  const ref = doc(db, "sessions", code, "participants", participantId);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      name: studentName,
      uid,
      joinedAt: serverTimestamp(),
      bestScore: 0,
      attempts: 0,
    });
  }
  return participantId;
}

export function subscribeParticipants(code, callback) {
  return onSnapshot(collection(db, "sessions", code, "participants"), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ---------- Answers (per attempt) ----------

export async function submitAnswer(code, attemptId, questionIndex, answerData) {
  const ref = doc(db, "sessions", code, "attempts", attemptId, "answers", String(questionIndex));
  await setDoc(ref, {
    ...answerData,
    submittedAt: serverTimestamp(),
  });
}

// Live per-question tally stored directly on the session doc for cheap real-time reads
export async function submitLiveTally(code, questionIndex, optionIndex) {
  const ref = doc(db, "sessions", code, "tallies", String(questionIndex));
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : { counts: {} };
  const counts = { ...data.counts };
  counts[optionIndex] = (counts[optionIndex] || 0) + 1;
  await setDoc(ref, { counts });
}

export function subscribeTally(code, questionIndex, callback) {
  return onSnapshot(doc(db, "sessions", code, "tallies", String(questionIndex)), (snap) => {
    callback(snap.exists() ? snap.data().counts || {} : {});
  });
}

// ---------- Attempts (a student's full run through a session) ----------

export async function createAttempt(code, participantId, studentName) {
  const ref = await addDoc(collection(db, "sessions", code, "attempts"), {
    participantId,
    studentName,
    startedAt: serverTimestamp(),
    finishedAt: null,
    score: 0,
    totalQuestions: 0,
    answers: [],
  });
  return ref.id;
}

export async function finalizeAttempt(code, attemptId, participantId, score, totalQuestions, answers) {
  await updateDoc(doc(db, "sessions", code, "attempts", attemptId), {
    finishedAt: serverTimestamp(),
    score,
    totalQuestions,
    answers,
  });

  const pRef = doc(db, "sessions", code, "participants", participantId);
  const pSnap = await getDoc(pRef);
  if (pSnap.exists()) {
    const prev = pSnap.data();
    await updateDoc(pRef, {
      bestScore: Math.max(prev.bestScore || 0, score),
      attempts: (prev.attempts || 0) + 1,
      lastScore: score,
    });
  }
}

export function subscribeAttempts(code, callback) {
  return onSnapshot(collection(db, "sessions", code, "attempts"), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function getAttemptsForParticipant(code, participantId) {
  const q = query(collection(db, "sessions", code, "attempts"), where("participantId", "==", participantId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Bulk question import ----------
//
// Accepts a few common paste formats so teachers don't have to reformat
// question banks by hand:
//
//  1) Labelled format (original):
//       Q: What is the unit of force?
//       A: Joule
//       B: Newton
//       C: Watt
//       D: Pascal
//       Ans: B
//       Sol: F = ma, measured in Newtons.   (optional)
//
//  2) Numbered format, answer marked with * or (correct):
//       1. What is the unit of force?
//       a) Joule
//       b) Newton *
//       c) Watt
//       d) Pascal
//
//  3) Numbered format with a separate "Answer: B" / "Correct: B" line.
//
// Blocks are separated by one or more blank lines. Unrecognised lines are
// ignored rather than throwing, so one malformed block doesn't kill the
// whole import — it's just skipped and reported back to the caller.

const OPTION_LINE = /^([A-Da-d])[\).:]\s*(.*)$/;
const NUMBERED_Q = /^\d+[\).:]\s*(.*)$/;
const QLABEL = /^q[:.]\s*(.*)$/i;
const ANSWER_LABEL = /^(ans|answer|correct)[:.]\s*(.*)$/i;
const SOLUTION_LABEL = /^(sol|solution|explanation)[:.]\s*(.*)$/i;

export function parseBulkQuestions(rawText) {
  const blocks = rawText
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const questions = [];
  let skipped = 0;

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    let text = "";
    const options = [];
    let correctIndex = null;
    let solution = "";
    let answerLetter = null;

    for (const line of lines) {
      const qLabelMatch = line.match(QLABEL);
      const numberedMatch = line.match(NUMBERED_Q);
      const optionMatch = line.match(OPTION_LINE);
      const answerMatch = line.match(ANSWER_LABEL);
      const solutionMatch = line.match(SOLUTION_LABEL);

      if (optionMatch) {
        let optText = optionMatch[2].trim();
        const isStarred = /\*\s*$/.test(optText) || /\(correct\)\s*$/i.test(optText);
        if (isStarred) {
          correctIndex = options.length;
          optText = optText.replace(/\*\s*$/, "").replace(/\(correct\)\s*$/i, "").trim();
        }
        options.push(optText);
      } else if (answerMatch) {
        answerLetter = answerMatch[2].trim().toUpperCase();
      } else if (solutionMatch) {
        solution = solutionMatch[2].trim();
      } else if (qLabelMatch) {
        text = qLabelMatch[1].trim();
      } else if (numberedMatch && !text) {
        text = numberedMatch[1].trim();
      } else if (!text) {
        // First unlabelled line in a block, treat as the question text.
        text = line;
      }
    }

    if (answerLetter) {
      const idx = "ABCD".indexOf(answerLetter[0]);
      if (idx >= 0) correctIndex = idx;
    }

    while (options.length < 4) options.push("");

    if (text && options[0] && options[1]) {
      questions.push({
        text,
        options: options.slice(0, 4),
        correctIndex: correctIndex ?? 0,
        solution: solution || "",
      });
    } else {
      skipped++;
    }
  }

  return { questions, skipped };
}
