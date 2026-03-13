import type { Express } from "express";
import * as client from "openid-client";
import memoize from "memoizee";
import { storage } from "../storage";
import {
  generateSessionId,
  getSessionExpiryDate,
  setSessionCookie,
  sanitizeEmail,
} from "../auth";
import { logger } from "../logger";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

const pendingStates = new Map<string, { domain: string; createdAt: number }>();

setInterval(() => {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const keys = Array.from(pendingStates.keys());
  for (const key of keys) {
    const val = pendingStates.get(key);
    if (val && val.createdAt < fiveMinAgo) pendingStates.delete(key);
  }
}, 60 * 1000);

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const domain = req.hostname;
      const state = crypto.randomUUID();
      pendingStates.set(state, { domain, createdAt: Date.now() });

      const redirectUri = `https://${domain}/api/auth/google/callback`;
      logger.info(`Google auth: domain=${domain}, redirect_uri=${redirectUri}`, "auth");
      
      const redirectUrl = client.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri,
        scope: "openid email profile",
        state,
        prompt: "login consent",
      });

      logger.info(`Google auth: redirecting to ${redirectUrl.origin}${redirectUrl.pathname}`, "auth");
      res.redirect(redirectUrl.href);
    } catch (error) {
      logger.error(`Google auth redirect error: ${error instanceof Error ? error.message : error}`, "auth");
      res.redirect("/login?error=google_unavailable");
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { state, code, error, error_description } = req.query;

      if (error) {
        logger.error(`OIDC provider returned error: ${error} — ${error_description || "no description"}`, "auth");
        return res.redirect("/login?error=google_failed");
      }

      if (!state || typeof state !== "string" || !pendingStates.has(state)) {
        return res.redirect("/login?error=invalid_state");
      }

      const { domain } = pendingStates.get(state)!;
      pendingStates.delete(state);

      const config = await getOidcConfig();
      const callbackUrl = `https://${domain}/api/auth/google/callback`;

      const tokens = await client.authorizationCodeGrant(
        config,
        new URL(`${callbackUrl}?${new URLSearchParams(req.query as Record<string, string>).toString()}`),
        { expectedState: state }
      );

      const claims = tokens.claims();
      if (!claims || !claims.email) {
        return res.redirect("/login?error=no_email");
      }

      if (claims.email_verified === false) {
        return res.redirect("/login?error=email_not_verified");
      }

      const email = sanitizeEmail(claims.email as string);
      const user = await storage.getUserByEmail(email);

      if (!user) {
        logger.info(`Google sign-in attempt with unregistered email: ${email}`, "auth");
        return res.redirect("/login?error=no_account");
      }

      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiryDate();
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      await storage.createSession(user.id, sessionId, expiresAt);
      await storage.createLoginLog(user.id, sessionId, clientIp);
      setSessionCookie(res, sessionId);

      logger.info(`Google sign-in successful: ${email} (userId: ${user.id})`, "auth");
      res.redirect("/");
    } catch (error) {
      logger.error(`Google auth callback error: ${error instanceof Error ? error.message : error}`, "auth");
      res.redirect("/login?error=google_failed");
    }
  });
}
