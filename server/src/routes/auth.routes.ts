import { randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import passport from "passport";
import { configuredProviders, sessionEnabled, webOrigin } from "../auth/passport.js";

const router = Router();

router.get("/config", (_req, res) => {
  res.json({ providers: configuredProviders });
});

router.get("/me", (req, res) => {
  if (!sessionEnabled) {
    return res.status(503).json({ error: "Authentication is not configured." });
  }
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const user = req.user;
  return res.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl ?? null,
    },
  });
});

function startOAuth(provider: "google" | "github") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!sessionEnabled || !configuredProviders[provider]) {
      return res.status(503).json({
        error: `${provider === "google" ? "Google" : "GitHub"} sign-in is not configured.`,
      });
    }

    const state = randomBytes(32).toString("hex");
    req.session.oauthState = state;
    req.session.oauthProvider = provider;
    req.session.save((error) => {
      if (error) return next(error);
      passport.authenticate(provider, {
        scope: provider === "google" ? ["profile", "email"] : ["user:email"],
        state,
      })(req, res, next);
    });
  };
}

function verifyOAuthState(provider: "google" | "github") {
  return (req: Request, res: Response, next: NextFunction) => {
    const expected = req.session?.oauthState;
    const expectedProvider = req.session?.oauthProvider;
    const received = req.query.state;
    delete req.session?.oauthState;
    delete req.session?.oauthProvider;

    const valid =
      typeof expected === "string" &&
      typeof received === "string" &&
      expectedProvider === provider &&
      expected.length === received.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(received));

    if (!valid) {
      if (!req.session) {
        return res.redirect(`${webOrigin}/login?error=oauth_failed`);
      }
      return req.session.save((error) => {
        if (error) return next(error);
        res.redirect(`${webOrigin}/login?error=oauth_failed`);
      });
    }

    req.session.save((error) => {
      if (error) return next(error);
      next();
    });
  };
}

for (const provider of ["google", "github"] as const) {
  router.get(`/${provider}`, startOAuth(provider));
  router.get(
    `/${provider}/callback`,
    verifyOAuthState(provider),
    passport.authenticate(provider, {
      failureRedirect: `${webOrigin}/login?error=oauth_failed`,
    }),
    (_req, res) => {
      res.redirect(`${webOrigin}/auth/callback?provider=${provider}`);
    }
  );
}

router.post("/logout", (req, res, next) => {
  if (!req.session) return res.sendStatus(204);

  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie("debuglabs.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.SESSION_COOKIE_SAME_SITE === "none" ? "none" : "lax",
        path: "/",
      });
      res.sendStatus(204);
    });
  });
});

export default router;
