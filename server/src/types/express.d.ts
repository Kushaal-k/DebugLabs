import "express-session";

declare global {
  namespace Express {
    interface User {
      id: string;
      displayName: string;
      email?: string | null;
      emailVerified: boolean;
      avatarUrl?: string | null;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    oauthProvider?: "google" | "github";
  }
}

export {};
