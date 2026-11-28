import { useState } from 'react';
import { Bug, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { LabShell } from '../common/LabShell';
import { ThemeToggle } from '../common/theme';
import { useAuth } from '../../context/useAuth';

type AuthMode = 'login' | 'signup';
type OAuthProvider = 'google' | 'github';

const AUTH_API_BASE = `${
  (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/+$/, '') ||
  '/api'
}/v1/auth`;

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.91 3.27-4.73 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.15a11 11 0 0 0 0 9.9l3.69-2.84Z" />
      <path fill="#EA4335" d="M12 4.36c1.62 0 3.08.56 4.23 1.67l3.17-3.17C17.45 1.09 14.97 0 12 0a11 11 0 0 0-9.85 7.05l3.69 2.84C6.71 7.29 9.14 4.36 12 4.36Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.7.08-.69.08-.69 1.12.08 1.7 1.15 1.7 1.15.99 1.69 2.6 1.2 3.23.91.1-.73.39-1.2.7-1.48-2.47-.28-5.07-1.23-5.07-5.5 0-1.21.43-2.2 1.15-2.97-.12-.28-.5-1.4.11-2.92 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.52.23 2.64.11 2.92.72.77 1.15 1.76 1.15 2.97 0 4.28-2.6 5.22-5.08 5.5.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { providers, isLoadingProviders, authError } = useAuth();
  const location = useLocation();
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const isSignup = mode === 'signup';
  const query = new URLSearchParams(location.search);
  const oauthFailed = query.get('error') === 'oauth_failed';

  function continueWith(provider: OAuthProvider) {
    setPendingProvider(provider);
    window.location.assign(`${AUTH_API_BASE}/${provider}`);
  }

  return (
    <LabShell>
      <div className="relative z-10 flex h-full flex-col overflow-y-auto px-4 py-4 sm:px-6">
        <header className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium tracking-tight text-lab-ink">
            <Bug aria-hidden="true" className="size-4 text-lab-accent" />
            DebugLabs
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center py-8">
          <section className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-9">
            <div className="mb-8 text-center">
              <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl border border-lab-line/10 bg-lab-line/[0.05]">
                <Bug aria-hidden="true" className="size-5 text-lab-accent" />
              </span>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-lab-muted">
                DebugLabs account
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-lab-ink">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-lab-secondary">
                {isSignup
                  ? 'Sign up to start exploring hands-on debugging labs.'
                  : 'Sign in to pick up where you left off.'}
              </p>
            </div>

            {oauthFailed && (
              <p role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm text-lab-danger">
                Sign-in could not be completed. Please try again.
              </p>
            )}
            {authError && !oauthFailed && (
              <p role="alert" className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-sm text-lab-warning">
                Sign-in services are currently unavailable. Please try again shortly.
              </p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => continueWith('google')}
                disabled={isLoadingProviders || !providers.google || pendingProvider !== null}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-lab-line/10 bg-lab-line/[0.04] text-sm font-medium text-lab-ink transition-colors hover:bg-lab-line/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-positive disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingProvider === 'google' ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => continueWith('github')}
                disabled={isLoadingProviders || !providers.github || pendingProvider !== null}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-lab-line/10 bg-lab-line/[0.04] text-sm font-medium text-lab-ink transition-colors hover:bg-lab-line/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-positive disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingProvider === 'github' ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <GitHubIcon />
                )}
                Continue with GitHub
              </button>
            </div>

            {!isLoadingProviders && !providers.google && !providers.github && (
              <p role="status" className="mt-4 text-center text-xs leading-5 text-lab-muted">
                OAuth providers are not configured on the server yet.
              </p>
            )}

            <div className="my-6 flex items-center gap-3 text-[11px] text-lab-muted">
              <span className="h-px flex-1 bg-lab-line/10" />
              SECURE SOCIAL SIGN-IN
              <span className="h-px flex-1 bg-lab-line/10" />
            </div>

            <p className="text-center text-sm text-lab-secondary">
              {isSignup ? 'Already have an account?' : 'New to DebugLabs?'}{' '}
              <Link
                to={isSignup ? '/login' : '/signup'}
                className="font-medium text-lab-accent underline-offset-4 hover:underline"
              >
                {isSignup ? 'Sign in' : 'Create an account'}
              </Link>
            </p>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-lab-muted">
              <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
              Your provider credentials are never shared with DebugLabs.
            </p>
          </section>
        </main>
        <footer className="pb-2 text-center text-[11px] text-lab-faint">
          Build, debug, and learn at your own pace.
        </footer>
      </div>
    </LabShell>
  );
}
