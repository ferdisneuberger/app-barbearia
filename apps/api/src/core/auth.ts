import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { AppData, Role, User } from "../domain/types.ts";
import { DomainError } from "./booking.ts";

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecretFromEnv = process.env.JWT_SECRET;

if (nodeEnv === "production" && !jwtSecretFromEnv) {
  throw new Error("JWT_SECRET precisa ser definido em producao.");
}

const JWT_SECRET = jwtSecretFromEnv ?? "barbearia-dev-secret";
export const AUTH_COOKIE_NAME = "barbearia.access_token";
export const REFRESH_COOKIE_NAME = "barbearia.refresh_token";
export const CSRF_COOKIE_NAME = "barbearia.csrf_token";
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type TokenType = "access" | "refresh";

type JwtPayload = {
  sub: string;
  role: Role;
  scope: string[];
  type: TokenType;
  exp: number;
};

const ROLE_SCOPES: Record<Role, string[]> = {
  client: [
    "bootstrap:read",
    "appointments:read:self",
    "appointments:create:self",
    "appointments:cancel:self",
    "availability:read"
  ],
  barber: [
    "bootstrap:read",
    "appointments:read:barber",
    "appointments:update:barber",
    "appointments:complete",
    "appointments:pay",
    "availability:read",
    "availability:update:self"
  ],
  admin: [
    "bootstrap:read",
    "appointments:read:any",
    "appointments:create:any",
    "appointments:update:any",
    "appointments:delete:any",
    "appointments:complete",
    "appointments:pay",
    "availability:read",
    "availability:update:any",
    "services:write",
    "clients:write",
    "barbers:write",
    "admin:manage",
    "financial:read"
  ]
};

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf-8")) as T;
}

function sign(value: string) {
  return createHmac("sha256", JWT_SECRET).update(value).digest("base64url");
}

function createSignedToken(user: User, type: TokenType, maxAgeSeconds: number) {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      scope: ROLE_SCOPES[user.role],
      type,
      exp: Math.floor(Date.now() / 1000) + maxAgeSeconds
    } satisfies JwtPayload)
  );

  const signature = sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function createAccessToken(user: User) {
  return createSignedToken(user, "access", ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export function createRefreshToken(user: User) {
  return createSignedToken(user, "refresh", REFRESH_TOKEN_MAX_AGE_SECONDS);
}

export function createCsrfToken() {
  return randomBytes(24).toString("base64url");
}

export function verifyToken(token: string, expectedType?: TokenType) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) {
    throw new DomainError("Token invalido.");
  }

  const expected = sign(`${header}.${payload}`);
  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) {
    throw new DomainError("Token invalido.");
  }

  const parsed = fromBase64Url<JwtPayload>(payload);
  if (parsed.exp <= Math.floor(Date.now() / 1000)) {
    throw new DomainError("Token expirado.");
  }

  if (expectedType && parsed.type !== expectedType) {
    throw new DomainError("Token invalido.");
  }

  return parsed;
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function getCookies(request: IncomingMessage) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .filter((parts) => parts[0])
      .map(([name, ...rest]) => [name, rest.join("=")])
  );
}

export function getBearerToken(request: IncomingMessage) {
  const authorization = request.headers.authorization;
  if (!authorization) {
    return null;
  }

  const [type, value] = authorization.split(" ");
  if (type !== "Bearer" || !value) {
    return null;
  }

  return value;
}

export function getAuthToken(request: IncomingMessage) {
  const cookies = getCookies(request);
  return getBearerToken(request) ?? cookies.get(AUTH_COOKIE_NAME) ?? null;
}

export function getRefreshAuthToken(request: IncomingMessage) {
  return getCookies(request).get(REFRESH_COOKIE_NAME) ?? null;
}

export function getCsrfTokenFromCookie(request: IncomingMessage) {
  return getCookies(request).get(CSRF_COOKIE_NAME) ?? null;
}

export function requireAuth(data: AppData, request: IncomingMessage, requiredScopes: string[]) {
  const token = getAuthToken(request);
  if (!token) {
    throw new DomainError("Usuario nao autenticado.");
  }

  const payload = verifyToken(token, "access");
  const actor = data.users.find((user) => user.id === payload.sub);

  if (!actor) {
    throw new DomainError("Usuario nao autenticado.");
  }

  const hasScope = requiredScopes.some((scope) => payload.scope.includes(scope));
  if (!hasScope) {
    throw new DomainError("Usuario sem permissao para acessar este recurso.");
  }

  return actor;
}

export function requireRefreshUser(data: AppData, request: IncomingMessage) {
  const token = getRefreshAuthToken(request);
  if (!token) {
    throw new DomainError("Usuario nao autenticado.");
  }

  const payload = verifyToken(token, "refresh");
  const actor = data.users.find((user) => user.id === payload.sub);

  if (!actor) {
    throw new DomainError("Usuario nao autenticado.");
  }

  return actor;
}

export function hasAnyScope(request: IncomingMessage, scopes: string[]) {
  const token = getAuthToken(request);
  if (!token) {
    return false;
  }

  try {
    const payload = verifyToken(token, "access");
    return scopes.some((scope) => payload.scope.includes(scope));
  } catch {
    return false;
  }
}
