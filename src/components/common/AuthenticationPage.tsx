import { useState, type FormEvent } from 'react';
import { Workflow } from 'lucide-react';
import { useAuth } from '../../auth/authContext';

export function AuthenticationPage() {
  const { configured, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setErrorMessage('');

    try {
      if (isSignUp) {
        await signUp(email, password, { username, fullName });
        setMessage('Account created. Check your email if confirmation is required, then sign in.');
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-300">
            <Workflow className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Universal Automata Lab</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp ? 'Create an account to continue' : 'Sign in to open the learning workspace'}
          </p>
        </div>

        {!configured ? (
          <p className="rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-200">
            Supabase is not configured. Add the project URL and publishable key to{' '}
            <code>.env.local</code>, then restart the development server.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <label className="block text-sm text-slate-300">
                    Full name
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      required
                      value={fullName}
                      onChange={event => setFullName(event.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    Username
                    <input
                      type="text"
                      autoComplete="username"
                      minLength={3}
                      maxLength={30}
                      pattern="[A-Za-z0-9_]{3,30}"
                      title="Use 3–30 letters, numbers, or underscores."
                      required
                      value={username}
                      onChange={event => setUsername(event.target.value.toLowerCase())}
                      className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                    />
                  </label>
                </>
              )}
              <label className="block text-sm text-slate-300">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Password
                <input
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                />
              </label>

              <p className="text-xs leading-relaxed text-slate-500">
                {isSignUp
                  ? 'Email and password are handled by Supabase Auth. Your username and full name are saved to your profile.'
                  : 'Use the email and password associated with your account.'}
              </p>

              <button
                type="submit"
                disabled={busy || !configured}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-400">
              {isSignUp ? 'Already have an account?' : 'New to the lab?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage('');
                  setErrorMessage('');
                }}
                className="font-semibold text-indigo-300 hover:text-white"
              >
                {isSignUp ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </>
        )}

        {message && <p className="mt-4 text-sm text-emerald-300" role="status">{message}</p>}
        {errorMessage && <p className="mt-4 text-sm text-rose-300" role="alert">{errorMessage}</p>}
      </section>
    </main>
  );
}
