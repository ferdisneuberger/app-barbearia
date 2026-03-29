import express from "express";
import type { Request } from "express";
import { CSRF_COOKIE_NAME, getCsrfTokenFromCookie } from "../core/auth.ts";
import { router } from "./routes.ts";
import { errorHandler, notFoundHandler } from "./utils.ts";

const CORS_ALLOW_HEADERS = "content-type,authorization,x-csrf-token";
const CORS_ALLOW_METHODS = "GET,POST,PATCH,DELETE,OPTIONS";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.HOST_IP ? `http://${process.env.HOST_IP}:5173` : null,
  process.env.HOST ? `http://${process.env.HOST}:5173` : null
].filter(Boolean) as string[];

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set((configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS));
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function isOriginAllowed(request: Request, allowedOrigins: Set<string>) {
  const origin = request.headers.origin;
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  const requestHost = request.headers.host;
  if (!requestHost) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(`http://${requestHost}`);

    return originUrl.hostname === requestUrl.hostname && originUrl.port === "5173";
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use((request, response, next) => {
    const origin = request.headers.origin;
    const originAllowed = isOriginAllowed(request, allowedOrigins);

    if (origin && originAllowed) {
      response.setHeader("Access-Control-Allow-Origin", origin);
    }
    response.setHeader("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
    response.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Vary", "Origin");

    if (request.method === "OPTIONS") {
      if (origin && !originAllowed) {
        response.sendStatus(403);
        return;
      }

      response.sendStatus(204);
      return;
    }

    if (origin && !originAllowed) {
      response.status(403).json({ message: "Origem nao permitida." });
      return;
    }

    next();
  });

  app.use(express.json());
  app.use((request, response, next) => {
    if (
      isSafeMethod(request.method) ||
      request.path === "/auth/login" ||
      request.path === "/auth/register" ||
      request.path === "/auth/refresh"
    ) {
      next();
      return;
    }

    const csrfHeader = request.headers["x-csrf-token"];
    const csrfToken = typeof csrfHeader === "string" ? csrfHeader : null;
    const csrfCookie = getCsrfTokenFromCookie(request);

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      response.status(403).json({ message: "Token CSRF invalido." });
      return;
    }

    next();
  });
  app.use(router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
