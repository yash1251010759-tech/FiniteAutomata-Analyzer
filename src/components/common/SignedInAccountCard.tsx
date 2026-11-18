import { useState } from 'react';
import { useAuth } from '../../auth/authContext';

export function SignedInAccountCard() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMessage('');
    try {
      await signOut();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign out failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
      <div>
        <p className="text-xs text-slate-400">Signed in as</p>
        <p className="text-sm font-medium text-slate-100">{user?.email}</p>
        {errorMessage && <p className="mt-1 text-xs text-rose-300" role="alert">{errorMessage}</p>}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={busy}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        {busy ? 'Please wait…' : 'Sign out'}
      </button>
    </div>
  );
}
