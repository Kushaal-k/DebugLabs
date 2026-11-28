import { useEffect } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

function AuthLoading() {
  return (
    <div className="lab-shell flex items-center justify-center">
      <div role="status" className="flex items-center gap-3 text-sm text-lab-secondary">
        <Loader2 aria-hidden="true" className="size-4 animate-spin text-lab-accent" />
        Checking your session…
      </div>
    </div>
  );
}

function AuthUnavailable() {
  const { authError, refreshUser } = useAuth();
  const navigate = useNavigate();

  async function retry() {
    if (await refreshUser()) {
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="lab-shell flex items-center justify-center px-5">
      <section className="glass-panel max-w-md rounded-3xl p-7 text-center">
        <Bug aria-hidden="true" className="mx-auto size-6 text-lab-accent" />
        <h1 className="mt-4 text-lg font-semibold text-lab-ink">Can’t verify your session</h1>
        <p className="mt-2 text-sm leading-6 text-lab-secondary">
          {authError || 'The authentication service did not respond.'}
        </p>
        <button
          type="button"
          onClick={() => void retry()}
          className="mt-5 h-10 rounded-full bg-lab-positive px-5 text-sm font-medium text-black hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-positive"
        >
          Try again
        </button>
      </section>
    </div>
  );
}

export function RequireAuthenticated() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AuthLoading />;
  if (status === 'unavailable') return <AuthUnavailable />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function RedirectAuthenticated() {
  const { status } = useAuth();
  if (status === 'loading') return <AuthLoading />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}

export function OAuthCallback() {
  const { status, refreshUser, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/', { replace: true });
    } else if (status === 'unauthenticated') {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [status, navigate]);

  if (status === 'unavailable') {
    return (
      <div className="lab-shell flex items-center justify-center px-5">
        <section className="glass-panel max-w-md rounded-3xl p-7 text-center">
          <h1 className="text-lg font-semibold text-lab-ink">Couldn’t finish sign-in</h1>
          <p className="mt-2 text-sm leading-6 text-lab-secondary">
            {authError || 'Your session could not be verified.'}
          </p>
          <button
            type="button"
            onClick={() => void refreshUser()}
            className="mt-5 h-10 rounded-full bg-lab-positive px-5 text-sm font-medium text-black hover:brightness-110"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  const provider = new URLSearchParams(location.search).get('provider');
  return (
    <div role="status" className="lab-shell flex items-center justify-center gap-3 text-sm text-lab-secondary">
      <Loader2 aria-hidden="true" className="size-4 animate-spin text-lab-accent" />
      Completing {provider === 'github' ? 'GitHub' : 'Google'} sign-in…
    </div>
  );
}
