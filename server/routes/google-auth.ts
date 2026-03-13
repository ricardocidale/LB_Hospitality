import type { Express } from "express";
import { OAuth2Client } from "google-auth-library";
import { storage } from "../storage";
import {
  generateSessionId,
  getSessionExpiryDate,
  setSessionCookie,
  sanitizeEmail,
} from "../auth";
import { logger } from "../logger";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

const pendingStates = new Map<string, { domain: string; createdAt: number }>();

setInterval(() => {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, val] of pendingStates) {
    if (val.createdAt < fiveMinAgo) pendingStates.delete(key);
  }
}, 60 * 1000);

function buildOAuth2Client(domain: string) {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `https://${domain}/api/auth/google/callback`
  );
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google", async (req, res) => {
    try {
      const domain = req.hostname;
      const state = crypto.randomUUID();
      pendingStates.set(state, { domain, createdAt: Date.now() });

      const oAuth2Client = buildOAuth2Client(domain);
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "email", "profile"],
        state,
        prompt: "select_account",
      });

      logger.info(`Google auth: redirecting to Google (domain=${domain})`, "auth");
      res.redirect(authorizeUrl);
    } catch (error) {
      logger.error(`Google auth redirect error: ${error instanceof Error ? error.message : error}`, "auth");
      res.redirect("/login?error=google_unavailable");
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { state, code, error: oauthError } = req.query;

      logger.info(`Google callback query: state=${state ? "present" : "missing"}, code=${code ? "present" : "missing"}, error=${oauthError || "none"}`, "auth");

      if (oauthError) {
        logger.error(`Google OAuth error: ${oauthError} (desc: ${req.query.error_description || "none"})`, "auth");
        return res.redirect("/login?error=google_failed");
      }

      if (!state || typeof state !== "string" || !pendingStates.has(state)) {
        logger.error(`Google callback: invalid state (pending states count: ${pendingStates.size})`, "auth");
        return res.redirect("/login?error=invalid_state");
      }

      if (!code || typeof code !== "string") {
        logger.error("Google callback: missing authorization code", "auth");
        return res.redirect("/login?error=google_failed");
      }

      const { domain } = pendingStates.get(state)!;
      pendingStates.delete(state);

      const oAuth2Client = buildOAuth2Client(domain);
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      if (!tokens.id_token) {
        return res.redirect("/login?error=no_email");
      }

      const ticket = await oAuth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.redirect("/login?error=no_email");
      }

      if (payload.email_verified === false) {
        return res.redirect("/login?error=email_not_verified");
      }

      const email = sanitizeEmail(payload.email);
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
