import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { AppData, Role, User } from "../domain/types.ts";
import { DomainError } from "./booking.ts";

const JWT_SECRET = process.env.JWT_SECRET ?? "barbearia-dev-secret";

type JwtPayload = {
  sub: string;
  role: Role;
  scope: string[];
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

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function createToken(user: User) {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      scope: ROLE_SCOPES[user.role],
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    } satisfies JwtPayload)
  );

  const signature = sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string) {
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

  return parsed;
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

export function requireAuth(data: AppData, request: IncomingMessage, requiredScopes: string[]) {
  const token = getBearerToken(request);
  if (!token) {
    throw new DomainError("Usuario nao autenticado.");
  }

  const payload = verifyToken(token);
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

export function hasAnyScope(request: IncomingMessage, scopes: string[]) {
  const token = getBearerToken(request);
  if (!token) {
    return false;
  }

  try {
    const payload = verifyToken(token);
    return scopes.some((scope) => payload.scope.includes(scope));
  } catch {
    return false;
  }
}
