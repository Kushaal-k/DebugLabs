import passport from "passport";
import { Strategy as GitHubStrategy, type Profile as GitHubProfile } from "passport-github2";
import { Strategy as GoogleStrategy, type Profile as GoogleProfile } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-oauth2";
import { UserModel } from "../models/user.model.js";

const serverOrigin = (
  process.env.SERVER_ORIGIN ?? `http://localhost:${process.env.PORT ?? "3001"}`
).replace(/\/+$/, "");

export const webOrigin = (
  process.env.WEB_ORIGIN ?? "http://localhost:5173"
).replace(/\/+$/, "");

const sessionEnabled = Boolean(process.env.SESSION_SECRET);


export const configuredProviders = {
  google:
    sessionEnabled &&
    Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github:
    sessionEnabled &&
    Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
};

interface OAuthIdentity {
  provider: "google" | "github";
  providerId: string;
  displayName: string;
  email?: string;
  emailVerified: boolean;
  avatarUrl?: string;
}

interface GitHubEmail {
  value: string;
  verified?: boolean;
  primary?: boolean;
}

async function findOrCreateUser(identity: OAuthIdentity) {
  const providerField =
    identity.provider === "google" ? "googleId" : "githubId";
  const existingUser = await UserModel.findOne({
    [providerField]: identity.providerId,
  });

  if (existingUser) {
    existingUser.displayName = identity.displayName;
    existingUser.avatarUrl = identity.avatarUrl;
    if (identity.email) {
      existingUser.email = identity.email;
      existingUser.emailVerified = identity.emailVerified;
    }
    await existingUser.save();
    return existingUser;
  }

  const user = new UserModel({
    displayName: identity.displayName,
    email: identity.email,
    emailVerified: identity.emailVerified,
    avatarUrl: identity.avatarUrl,
    [providerField]: identity.providerId,
  });

  try {
    await user.save();
    return user;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const concurrentUser = await UserModel.findOne({
        [providerField]: identity.providerId,
      });
      if (concurrentUser) return concurrentUser;
    }
    throw error;
  }
}

function googleIdentity(profile: GoogleProfile): OAuthIdentity {
  const verifiedEmail = profile.emails?.find((email) => email.verified);
  return {
    provider: "google",
    providerId: profile.id,
    displayName: profile.displayName || verifiedEmail?.value || "DebugLabs user",
    email: verifiedEmail?.value.toLowerCase(),
    emailVerified: Boolean(verifiedEmail),
    avatarUrl: profile.photos?.[0]?.value,
  };
}

function githubIdentity(profile: GitHubProfile): OAuthIdentity {
  const emails = profile.emails as GitHubEmail[] | undefined;
  const verifiedEmail =
    emails?.find((email) => email.verified && email.primary) ??
    emails?.find((email) => email.verified);
  return {
    provider: "github",
    providerId: profile.id,
    displayName: profile.displayName || profile.username || "DebugLabs user",
    email: verifiedEmail?.value.toLowerCase(),
    emailVerified: Boolean(verifiedEmail),
    avatarUrl: profile.photos?.[0]?.value,
  };
}

if (configuredProviders.google) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${serverOrigin}/api/v1/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: VerifyCallback
      ) => {
        try {
          done(null, await findOrCreateUser(googleIdentity(profile)));
        } catch (error) {
          done(error instanceof Error ? error : new Error(String(error)));
        }
      }
    )
  );
}

if (configuredProviders.github) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: `${serverOrigin}/api/v1/auth/github/callback`,
        scope: ["user:email"],
        allRawEmails: true,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: VerifyCallback
      ) => {
        try {
          done(null, await findOrCreateUser(githubIdentity(profile)));
        } catch (error) {
          done(error instanceof Error ? error : new Error(String(error)));
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user ?? false);
  } catch (error) {
    done(error instanceof Error ? error : new Error(String(error)));
  }
});

export { sessionEnabled };
