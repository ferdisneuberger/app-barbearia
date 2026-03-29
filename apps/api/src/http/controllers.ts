import type { Request, Response } from "express";
import { createToken, requireAuth, serializeUser } from "../core/auth.ts";
import {
  buildFinancialSummary,
  cancelAppointment,
  completeAppointment,
  createAppointment,
  deleteAppointment,
  listBookableAvailability,
  listBookableAvailabilityMonth,
  listAvailability,
  registerPayment,
  toggleAvailability,
  updateAppointment
} from "../core/booking.ts";
import {
  createBarberByAdmin,
  createClientByAdmin,
  createPublicClient,
  createServiceByAdmin,
  updateServiceByAdmin
} from "../core/admin.ts";
import {
  filterAppointments,
  serializeBarbers,
  serializeClients
} from "../core/queries.ts";
import { findUserByCredentials, loadAppData, mutateAppData } from "../infra/mongo.ts";

const MISSING_BARBER_AND_DATE_MESSAGE = "barberId e date sao obrigatorios.";

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

export function healthController(_request: Request, response: Response) {
  response.status(200).json({ status: "ok" });
}

export async function loginController(request: Request, response: Response) {
  const body = request.body as { email?: string; password?: string };
  const user = await findUserByCredentials(body.email ?? "", body.password ?? "");

  if (!user) {
    response.status(401).json({ message: "Credenciais invalidas." });
    return;
  }

  response.status(200).json({ user: serializeUser(user as any), token: createToken(user as any) });
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
  response.status(201).json({ user: serializeUser(user), token: createToken(user) });
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
  requireAuth(data, request, ["bootstrap:read"]);

  response.status(200).json({
    services: data.services,
    barbers: serializeBarbers(data),
    clients: serializeClients(data)
  });
}

export async function listAppointmentsController(request: Request, response: Response) {
  const data = await loadAppData();
  const actor = requireAuth(data, request, [
    "appointments:read:self",
    "appointments:read:barber",
    "appointments:read:any"
  ]);

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
  requireAuth(data, request, ["availability:read"]);

  const barberId = getQueryValue(request.query.barberId);
  const date = getQueryValue(request.query.date);

  if (!barberId || !date) {
    response.status(400).json({ message: MISSING_BARBER_AND_DATE_MESSAGE });
    return;
  }

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
  requireAuth(data, request, ["availability:read"]);

  const barberId = getQueryValue(request.query.barberId);
  const date = getQueryValue(request.query.date);

  if (!barberId || !date) {
    response.status(400).json({ message: MISSING_BARBER_AND_DATE_MESSAGE });
    return;
  }

  response.status(200).json(listBookableAvailability(data, barberId, date, getCurrentDate()));
}

export async function listBookableAvailabilityMonthController(request: Request, response: Response) {
  const data = await loadAppData();
  requireAuth(data, request, ["availability:read"]);

  const barberId = getQueryValue(request.query.barberId);
  const month = getQueryValue(request.query.month);

  if (!barberId || !month) {
    response.status(400).json({ message: "barberId e month sao obrigatorios." });
    return;
  }

  response.status(200).json(listBookableAvailabilityMonth(data, barberId, month, getCurrentDate()));
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
  const body = request.body as { name: string; priceInCents: number };
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
  };
  const service = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["services:write"]);
    return updateServiceByAdmin(data, actor, getRouteParam(request.params.serviceId), body);
  });
  response.status(200).json(service);
}

export async function createClientController(request: Request, response: Response) {
  const body = request.body as { name: string; email: string; password: string };
  const client = await mutateAppData((data) => {
    const actor = requireAuth(data, request, ["clients:write"]);
    return createClientByAdmin(data, actor, body);
  });
  response.status(201).json(client);
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
