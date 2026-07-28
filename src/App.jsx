import { useEffect, useState } from "react";
import { ensureAuth, auth, onAuthChange, isAdminUser, adminSignOut } from "./firebase";
import { joinSession, getSession } from "./api/quizData";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import QuizBuilder from "./pages/QuizBuilder";
import AdminHost from "./pages/AdminHost";
import StudentJoin from "./pages/StudentJoin";
import StudentLiveQuiz from "./pages/StudentLiveQuiz";
import StudentTest from "./pages/StudentTest";
import { Card, Button } from "./components/ui";

function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink">
      <div className="max-w-sm w-full text-center space-y-8 animate-popIn">
        <div>
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-amber/15 text-amber font-display font-bold text-xl mb-4">
            Q
          </div>
          <h1 className="font-display font-bold text-3xl text-chalk">ClassQuiz</h1>
          <p className="text-slate text-sm mt-2">Live quizzes and self-paced tests for your classroom.</p>
        </div>
        <div className="space-y-3">
          <Card className="text-left hover:border-amber/30 transition-colors">
            <h2 className="font-display font-semibold mb-1 text-chalk">I'm a student</h2>
            <p className="text-slate text-sm mb-4">Join a live quiz or test with a room code.</p>
            <Button className="w-full" onClick={() => (window.location.hash = "#/join")}>
              Join a session
            </Button>
          </Card>
          <Card className="text-left hover:border-amber/30 transition-colors">
            <h2 className="font-display font-semibold mb-1 text-chalk">I'm the teacher</h2>
            <p className="text-slate text-sm mb-4">Create and host quizzes for your class.</p>
            <Button variant="secondary" className="w-full" onClick={() => (window.location.hash = "#/admin")}>
              Admin panel
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  return parts;
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [route, setRoute] = useState(parseHash());
  const [currentUser, setCurrentUser] = useState(null);
  const [builderState, setBuilderState] = useState(null); // null | { mode: "new" } | { mode: "edit", quiz }
  const [hostingCode, setHostingCode] = useState(null);

  const [studentSession, setStudentSession] = useState(null); // {code, participantId, name, mode}

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setCurrentUser(user);
    });
    ensureAuth()
      .then(() => setAuthReady(true))
      .catch((e) => setAuthError(e.message));
    return unsub;
  }, []);

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ink">
        <Card className="max-w-md text-center space-y-3">
          <h1 className="font-display font-bold text-xl text-wrong">Connection error</h1>
          <p className="text-slate text-sm">
            Couldn't connect to Firebase. Make sure the config in <code className="text-chalk">src/firebase.js</code> is
            filled in with your project's keys, and that Anonymous auth + Firestore are enabled.
          </p>
          <p className="text-xs text-slate/60">{authError}</p>
        </Card>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-slate">Connecting...</p>
      </div>
    );
  }

  const isAdminRoute = route[0] === "admin";
  const isJoinRoute = route[0] === "join";
  const isRootRoute = route.length === 0;
  const joinCodeFromUrl = isJoinRoute ? route[1] : "";
  const adminLoggedIn = isAdminUser(currentUser);

  // ---------- Admin flow ----------
  if (isAdminRoute) {
    if (!adminLoggedIn) {
      return <AdminLogin onSuccess={() => {}} />;
    }
    if (hostingCode) {
      return <AdminHost code={hostingCode} onExit={() => setHostingCode(null)} />;
    }
    if (builderState) {
      return (
        <QuizBuilder
          existingQuiz={builderState.quiz}
          onCreated={() => setBuilderState(null)}
          onCancel={() => setBuilderState(null)}
        />
      );
    }
    return (
      <AdminDashboard
        onCreateNew={() => setBuilderState({ mode: "new" })}
        onEdit={(quiz) => setBuilderState({ mode: "edit", quiz })}
        onLaunched={(code) => setHostingCode(code)}
        onLogout={async () => {
          await adminSignOut();
        }}
      />
    );
  }

  // ---------- Landing (root route, before choosing a role) ----------
  if (isRootRoute && !studentSession) {
    return <Landing />;
  }

  // ---------- Student flow ----------
  if (studentSession) {
    if (studentSession.mode === "live") {
      return (
        <StudentLiveQuiz
          code={studentSession.code}
          participantId={studentSession.participantId}
          studentName={studentSession.name}
          onDone={() => setStudentSession(null)}
        />
      );
    }
    return (
      <StudentTest
        code={studentSession.code}
        participantId={studentSession.participantId}
        studentName={studentSession.name}
        onDone={() => setStudentSession(null)}
      />
    );
  }

  return (
    <StudentJoin
      initialCode={joinCodeFromUrl}
      onJoin={async (code, name) => {
        const uid = auth.currentUser.uid;
        const participantId = await joinSession(code, name, uid);
        const session = await getSession(code);
        setStudentSession({ code, participantId, name, mode: session.mode });
      }}
    />
  );
}
