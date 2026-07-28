import { useState } from "react";
import { Button, Card, Input } from "../components/ui";
import { adminSignIn } from "../firebase";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminSignIn(email.trim(), password);
      onSuccess();
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Wait a moment and try again.");
      } else {
        setError("Couldn't sign in. " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink">
      <div className="w-full max-w-sm animate-popIn">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-amber/15 text-amber font-display font-bold text-xl mb-4">
            Q
          </div>
          <h1 className="font-display font-bold text-2xl text-chalk">Admin sign in</h1>
          <p className="text-slate text-sm mt-1.5">Sign in with your teacher account to manage quizzes.</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              autoFocus
              autoComplete="username"
              required
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {error && <p className="text-wrong text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
        <p className="text-slate/60 text-xs text-center mt-6">
          Don't have an account? Ask whoever manages your Firebase project to add you
          under Authentication → Users.
        </p>
      </div>
    </div>
  );
}
