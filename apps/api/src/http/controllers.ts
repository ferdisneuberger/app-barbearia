import type { Request, Response } from "express";
import {
  AUTH_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  createAccessToken,
  createCsrfToken,
  createRefreshToken,
  CSRF_COOKIE_NAME,
  getCsrfTokenFromCookie,
  REFRESH_COOKIE_NAME,
  requireAuth,
  requireRefreshUser,
  serializeUser
} from "../core/auth.ts";
import {
  buildFinancialSummary,
  cancelAppointment,
  completeAppointment,
  createAppointment,
  deleteAppointment,
  listAvailabilityMonth,
  listBookableAvailability,
  listBookableAvailabilityMonth,
  listAvailability,
  registerPayment,
  toggleAvailability,
  updateAppointment
} from "../core/booking.ts";
import {
  createAdminByAdmin,
  createBarberByAdmin,
  createClientByAdmin,
  createPublicClient,
  createServiceByAdmin,
  deleteAdminByAdmin,
  deleteBarberByAdmin,
  deleteClientByAdmin,
  deleteServiceByAdmin,
  updateBusinessRulesByAdmin,
  updateServiceByAdmin
} from "../core/admin.ts";
import {
  filterAppointments,
  serializeAdmins,
  serializeBarbers,
  serializeClients
} from "../core/queries.ts";
import { logInfo } from "./logger.ts";
import { findUserByCredentials, loadAppData, mutateAppData } from "../infra/mongo.ts";

const MISSING_BARBER_AND_DATE_MESSAGE = "barberId e date sao obrigatorios.";
const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

function getQueryValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getRouteParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return "";
}

function getCurrentDate() {
  return new Date();
}

type CookieSameSite = "lax" | "strict" | "none";

function getCookieOptions() {
  const secureSetting = process.env.AUTH_COOKIE_SECURE;
  const secure =
    secureSetting === "true" || (secureSetting !== "false" && process.env.NODE_ENV === "production");
  const sameSite = (process.env.AUTH_COOKIE_SAMESITE ?? "lax").toLowerCase() as CookieSameSite;

  return {
    secure,
    sameSite: sameSite === "none" || sameSite === "strict" ? sameSite : "lax",
    domain: process.env.AUTH_COOKIE_DOMAIN?.trim() || null,
    path: process.env.AUTH_COOKIE_PATH?.trim() || "/"
  };
}

function setCookie(
  response: Response,
  name: string,
  value: string,
  options: { httpOnly: boolean; maxAgeSeconds: number }
) {
  const cookieOptions = getCookieOptions();
  const expires = new Date(Date.now() + options.maxAgeSeconds * 1000).toUTCString();
  const cookie = [
    `${name}=${value}`,
    `Path=${cookieOptions.path}`,
    `SameSite=${cookieOptions.sameSite}`,
    `Max-Age=${options.maxAgeSeconds}`,
    `Expires=${expires}`,
    "Priority=High"
  ];

  if (options.httpOnly) {
    cookie.push("HttpOnly");
  }

  if (cookieOptions.domain) {
    cookie.push(`Domain=${cookieOptions.domain}`);
  }

  if (cookieOptions.secure) {
    cookie.push("Secure");
  }

  response.append("Set-Cookie", cookie.join("; "));
}

function clearCookie(response: Response, name: string, httpOnly: boolean) {
  const cookieOptions = getCookieOptions();
  const cookie = [
    `${name}=`,
    `Path=${cookieOptions.path}`,
    `SameSite=${cookieOptions.sameSite}`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Priority=High"
  ];

  if (httpOnly) {
    cookie.push("HttpOnly");
  }

  if (cookieOptions.domain) {
    cookie.push(`Domain=${cookieOptions.domain}`);
  }

  if (cookieOptions.secure) {
    cookie.push("Secure");
  }

  response.append("Set-Cookie", cookie.join("; "));
}

function setAuthCookies(response: Response, accessToken: string, refreshToken: string, csrfToken: string) {
  setCookie(response, AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    maxAgeSeconds: ACCESS_TOKEN_MAX_AGE_SECONDS
  });
  setCookie(response, REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    maxAgeSeconds: ONE_WEEK_IN_SECONDS
  });
  setCookie(response, CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    maxAgeSeconds: ONE_WEEK_IN_SECONDS
  });
}

function clearAuthCookies(response: Response) {
  clearCookie(response, AUTH_COOKIE_NAME, true);
  clearCookie(response, REFRESH_COOKIE_NAME, true);
  clearCookie(response, CSRF_COOKIE_NAME, false);
}

export function healthController(_request: Request, response: Response) {
  response.status(200).json({ status: "ok" });
}

export async function loginController(request: Request, response: Response) {
  const body = request.body as { email?: string; password?: string };
  logInfo(`[auth.login] email=${body.email ?? ""}`);
  const user = await findUserByCredentials(body.email ?? "", body.password ?? "");

  if (!user) {
    response.status(401).json({ message: "Credenciais invalidas." });
    return;
  }

  const accessToken = createAccessToken(user as any);
  setAuthCookies(response, accessToken, createRefreshToken(user as any), createCsrfToken());
  response.status(200).json({ user: serializeUser(user as any), accessToken });
}

export async function registerController(request: Request, response: Response) {
  const body = request.body as { name?: string; email?: string; password?: string };
  const user = await mutateAppData((data) =>
    createPublicClient(data, {
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? ""
    })
  );
  const accessToken = createAccessToken(user);
  setAuthCookies(response, accessToken, createRefreshToken(user), createCsrfToken());
  response.status(201).json({ user: serializeUser(user), accessToken });
}

export function logoutController(_request: Request, response: Response) {
  clearAuthCookies(response);
  response.status(204).end();
}

export async function refreshController(request: Request, response: Response) {
  const data = await loadAppData();
  const user = requireRefreshUser(data, request);
  const csrfToken = getCsrfTokenFromCookie(request) ?? createCsrfToken();
  const accessToken = createAccessToken(user);

  setCookie(response, AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    maxAgeSeconds: ACCESS_TOKEN_MAX_AGE_SECONDS
  });
  setCookie(response, CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    maxAgeSeconds: ONE_WEEK_IN_SECONDS
  });

  response.status(200).json({ user: serializeUser(user), accessToken });
}

export async function meController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, [
    "bootstrap:read",
    "appointments:read:self",
    "appointments:read:barber",
    "appointments:read:any"
  ]);

  response.status(200).json({ user: serializeUser(actor) });
}

export async function bootstrapController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, ["bootstrap:read"]);
  logInfo(`[bootstrap] actor=${actor.email} role=${actor.role}`);

  response.status(200).json({
    services: data.services,
    admins: serializeAdmins(data),
    barbers: serializeBarbers(data),
    clients: serializeClients(data),
    businessRules: data.businessRules
  });
}

export async function listAppointmentsController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, [
    "appointments:read:self",
    "appointments:read:barber",
    "appointments:read:any"
  ]);
  logInfo(
    `[appointments.list] actor=${actor.email} role=${actor.role} date=${getQueryValue(request.query.date) ?? ""} barberId=${getQueryValue(request.query.barberId) ?? ""} clientId=${getQueryValue(request.query.clientId) ?? ""}`
  );

  response.status(200).json(
    filterAppointments(data, actor, {
      barberId: getQueryValue(request.query.barberId),
      clientId: getQueryValue(request.query.clientId),
      date: getQueryValue(request.query.date)
    })
  );
}

export async function listAvailabilityController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, ["availability:read"]);

  const barberId = getQueryValue(request.query.barberId);
  const date = getQueryValue(request.query.date);

  if (!barberId || !date) {
    response.status(400).json({ message: MISSING_BARBER_AND_DATE_MESSAGE });
    return;
  }

  logInfo(`[availability.day] actor=${actor.email} barberId=${barberId} date=${date}`);

  response.status(200).json(listAvailability(data, barberId, date));
}

export async function financialSummaryController(request: Request, response: Response) {
  const data = await loadAppData();
  requireAuth(data, request, ["financial:read"]);

  const startDate = getQueryValue(request.query.startDate);
  const endDate = getQueryValue(request.query.endDate);

  if (!startDate || !endDate) {
    response.status(400).json({ message: "startDate e endDate sao obrigatorios." });
    return;
  }

  response.status(200).json(buildFinancialSummary(data, startDate, endDate));
}

export async function listBookableAvailabilityController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, ["availability:read"]);

  const barberId = getQueryValue(request.query.barberId);
  const date = getQueryValue(request.query.date);

  if (!barberId || !date) {
    response.status(400).json({ message: MISSING_BARBER_AND_DATE_MESSAGE });
    return;
  }

  logInfo(`[availability.booking.day] actor=${actor.email} barberId=${barberId} date=${date}`);

  response.status(200).json(listBookableAvailability(data, barberId, date, getCurrentDate()));
}

export async function listBookableAvailabilityMonthController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, ["availability:read"]);

  const barberId = getQueryValue(request.query.barberId);
  const month = getQueryValue(request.query.month);

  if (!barberId || !month) {
    response.status(400).json({ message: "barberId e month sao obrigatorios." });
    return;
  }

  logInfo(`[availability.booking.month] actor=${actor.email} barberId=${barberId} month=${month}`);

  response.status(200).json(listBookableAvailabilityMonth(data, barberId, month, getCurrentDate()));
}

export async function listAvailabilityMonthController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, ["availability:read"]);

  const barberId = getQueryValue(request.query.barberId);
  const month = getQueryValue(request.query.month);

  if (!barberId || !month) {
    response.status(400).json({ message: "barberId e month sao obrigatorios." });
    return;
  }

  logInfo(`[availability.month] actor=${actor.email} barberId=${barberId} month=${month}`);

  response.status(200).json(listAvailabilityMonth(data, barberId, month));
}

export async function createAppointmentController(request: Request, response: Response) {
  const body = request.body as {
    clientId: string;
    barberId: string;
    serviceId: string;
    date: string;
    time: string;
  };
  const appointment = await mutateAppData((data) => {
    const actor = requireAuth(data, request, [
      "appointments:create:self",
      "appointments:create:any"
    ]);
    logInfo(
      `[appointments.create] actor=${actor.email} role=${actor.role} clientId=${body.clientId} barberId=${body.barberId} serviceId=${body.serviceId} date=${body.date} time=${body.time}`
    );

    return createAppointment(data, {
      actor,
      clientId: body.clientId,
      barberId: body.barberId,
      serviceId: body.serviceId,
      date: body.date,
      time: body.time,
      now: getCurrentDate()
    });
  });

  response.status(201).json(appointment);
}

export async function cancelAppointmentController(request: Request, response: Response) {
  const result = await mutateAppData((data) => {
    const actor = requireAuth(data, request, [
      "appointments:cancel:self",
      "appointments:update:barber",
      "appointments:update:any"
    ]);
    logInfo(
      `[appointments.cancel] actor=${actor.email} role=${actor.role} appointmentId=${getRouteParam(request.params.appointmentId)}`
    );

    return cancelAppointment(data, {
      actor,
      appointmentId: getRouteParam(request.params.appointmentId),
      now: getCurrentDate()
    });
  });

  response.status(200).json(result);
}

export async function completeAppointmentController(request: Request, response: Response) {
  const result = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["appointments:complete"]);
    logInfo(
      `[appointments.complete] actor=${actor.email} role=${actor.role} appointmentId=${getRouteParam(request.params.appointmentId)}`
    );
    return completeAppointment(data, {
      actor,
      appointmentId: getRouteParam(request.params.appointmentId),
      now: getCurrentDate()
    });
  });

  response.status(200).json(result);
}

export async function payAppointmentController(request: Request, response: Response) {
  const result = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["appointments:pay"]);
    logInfo(
      `[appointments.pay] actor=${actor.email} role=${actor.role} appointmentId=${getRouteParam(request.params.appointmentId)}`
    );
    return registerPayment(data, {
      actor,
      appointmentId: getRouteParam(request.params.appointmentId),
      now: getCurrentDate()
    });
  });

  response.status(200).json(result);
}

export async function updateAppointmentController(request: Request, response: Response) {
  const body = request.body as {
    serviceId?: string;
    date?: string;
    time?: string;
  };
  const result = await mutateAppData((data) => {
    const actor = requireAuth(data, request, [
      "appointments:update:barber",
      "appointments:update:any"
    ]);
    logInfo(
      `[appointments.update] actor=${actor.email} role=${actor.role} appointmentId=${getRouteParam(request.params.appointmentId)} serviceId=${body.serviceId ?? ""} date=${body.date ?? ""} time=${body.time ?? ""}`
    );

    return updateAppointment(data, {
      actor,
      appointmentId: getRouteParam(request.params.appointmentId),
      serviceId: body.serviceId,
      date: body.date,
      time: body.time,
      now: getCurrentDate()
    });
  });

  response.status(200).json(result);
}

export async function deleteAppointmentController(request: Request, response: Response) {
  const removed = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["appointments:delete:any"]);
    logInfo(
      `[appointments.delete] actor=${actor.email} role=${actor.role} appointmentId=${getRouteParam(request.params.appointmentId)}`
    );
    return deleteAppointment(data, {
      actor,
      appointmentId: getRouteParam(request.params.appointmentId),
      now: getCurrentDate()
    });
  });

  response.status(200).json(removed);
}

export async function updateAvailabilityController(request: Request, response: Response) {
  const body = request.body as {
    barberId: string;
    date: string;
    time: string;
    enabled: boolean;
  };
  const result = await mutateAppData((data) => {
    const actor = requireAuth(data, request, [
      "availability:update:self",
      "availability:update:any"
    ]);
    logInfo(
      `[availability.update] actor=${actor.email} role=${actor.role} barberId=${body.barberId} date=${body.date} time=${body.time} enabled=${String(body.enabled)}`
    );

    return toggleAvailability(data, {
      actor,
      barberId: body.barberId,
      date: body.date,
      time: body.time,
      enabled: body.enabled
    });
  });

  response.status(200).json(result);
}

export async function createServiceController(request: Request, response: Response) {
  const body = request.body as {
    name: string;
    priceInCents: number;
    assignToAllBarbers?: boolean;
    barberIds?: string[];
  };
  const service = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["services:write"]);
    return createServiceByAdmin(data, actor, body);
  });
  response.status(201).json(service);
}

export async function updateServiceController(request: Request, response: Response) {
  const body = request.body as {
    name?: string;
    priceInCents?: number;
    active?: boolean;
    assignToAllBarbers?: boolean;
    barberIds?: string[];
  };
  const service = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["services:write"]);
    return updateServiceByAdmin(data, actor, getRouteParam(request.params.serviceId), body);
  });
  response.status(200).json(service);
}

export async function deleteServiceController(request: Request, response: Response) {
  await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["services:write"]);
    deleteServiceByAdmin(data, actor, getRouteParam(request.params.serviceId));
  });

  response.status(204).end();
}

export async function createClientController(request: Request, response: Response) {
  const body = request.body as { name: string; email: string; password: string };
  const client = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["clients:write"]);
    return createClientByAdmin(data, actor, body);
  });
  response.status(201).json(client);
}

export async function deleteClientController(request: Request, response: Response) {
  await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["clients:write"]);
    deleteClientByAdmin(data, actor, getRouteParam(request.params.clientId));
  });

  response.status(204).end();
}

export async function createBarberController(request: Request, response: Response) {
  const body = request.body as {
    name: string;
    email: string;
    password: string;
    serviceIds: string[];
  };
  const barber = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["barbers:write"]);
    return createBarberByAdmin(data, actor, body);
  });
  response.status(201).json(barber);
}

export async function deleteBarberController(request: Request, response: Response) {
  await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["barbers:write"]);
    deleteBarberByAdmin(data, actor, getRouteParam(request.params.barberId));
  });

  response.status(204).end();
}

export async function createAdminController(request: Request, response: Response) {
  const body = request.body as { name: string; email: string; password: string };
  const admin = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["admin:manage"]);
    return createAdminByAdmin(data, actor, body);
  });

  response.status(201).json(serializeUser(admin));
}

export async function deleteAdminController(request: Request, response: Response) {
  await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["admin:manage"]);
    deleteAdminByAdmin(data, actor, getRouteParam(request.params.adminId));
  });

  response.status(204).end();
}

export async function updateBusinessRulesController(request: Request, response: Response) {
  const body = request.body as {
    appointmentCompletionRule?: "after_start" | "anytime";
    barberCancellationHours?: number;
    clientCancellationHours?: number;
    clientBookingNoticeHours?: number;
  };

  const businessRules = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["admin:manage"]);
    return updateBusinessRulesByAdmin(data, actor, body);
  });

  response.status(200).json(businessRules);
}
