import {
  APPOINTMENT_DURATION_MINUTES,
  BARBER_RESCHEDULE_HOURS,
  CLIENT_RESCHEDULE_HOURS,
  MIN_BOOKING_NOTICE_HOURS,
  addMinutes,
  buildIso,
  diffHours,
  formatCurrencyFromCents,
  isWithinBusinessHours,
  toBrasiliaIso
} from "./time.ts";
import type { AppData, Appointment, AvailabilitySlot, Role, Service, User } from "../domain/types.ts";

export class DomainError extends Error {}

type CreateAppointmentInput = {
  actor: User;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  now: Date;
};

type ChangeAppointmentStatusInput = {
  actor: User;
  appointmentId: string;
  now: Date;
};

type UpdateAppointmentInput = {
  actor: User;
  appointmentId: string;
  now: Date;
  serviceId?: string;
  date?: string;
  time?: string;
};

type ToggleAvailabilityInput = {
  actor: User;
  barberId: string;
  date: string;
  time: string;
  enabled: boolean;
};

type AvailabilityView = {
  startsAt: string;
  enabled: boolean;
  reserved: boolean;
  available: boolean;
};

function getBarberService(data: AppData, barberId: string, serviceId: string) {
  const barber = data.barbers.find((item) => item.id === barberId);
  if (!barber) {
    throw new DomainError("Barbeiro nao encontrado.");
  }

  if (!barber.serviceIds.includes(serviceId)) {
    throw new DomainError("Barbeiro nao atende o servico informado.");
  }

  return barber;
}

function getService(data: AppData, serviceId: string): Service {
  const service = data.services.find((item) => item.id === serviceId);
  if (!service) {
    throw new DomainError("Servico nao encontrado.");
  }
  return service;
}

function assertServiceActive(service: Service) {
  if (!service.active) {
    throw new DomainError("Servico indisponivel para novos agendamentos.");
  }
}

function getClientIdForActor(data: AppData, actor: User) {
  const client = data.clients.find((item) => item.userId === actor.id);
  if (!client) {
    throw new DomainError("Cliente nao encontrado para o usuario autenticado.");
  }
  return client.id;
}

function getBarberIdForActor(data: AppData, actor: User) {
  const barber = data.barbers.find((item) => item.userId === actor.id);
  if (!barber) {
    throw new DomainError("Barbeiro nao encontrado para o usuario autenticado.");
  }
  return barber.id;
}

function assertAppointmentOwnership(data: AppData, actor: User, appointment: Appointment) {
  if (actor.role === "client") {
    if (appointment.clientId !== getClientIdForActor(data, actor)) {
      throw new DomainError("Cliente sem permissao para este agendamento.");
    }
  }

  if (actor.role === "barber") {
    if (appointment.barberId !== getBarberIdForActor(data, actor)) {
      throw new DomainError("Barbeiro sem permissao para este agendamento.");
    }
  }
}

function assertClientExists(data: AppData, clientId: string) {
  const client = data.clients.find((item) => item.id === clientId);
  if (!client) {
    throw new DomainError("Cliente informado nao encontrado.");
  }
  return client;
}

function findAvailabilitySlot(data: AppData, barberId: string, startsAt: string) {
  return data.availability.find((slot) => slot.barberId === barberId && slot.startsAt === startsAt);
}

function assertAppointmentManagement(actorRole: Role, hoursUntil: number) {
  if (actorRole === "admin") {
    return;
  }

  if (actorRole === "client" && hoursUntil < CLIENT_RESCHEDULE_HOURS) {
    throw new DomainError("Cliente precisa de no minimo 3 horas para cancelar ou remarcar.");
  }

  if (actorRole === "barber" && hoursUntil < BARBER_RESCHEDULE_HOURS) {
    throw new DomainError("Barbeiro precisa de no minimo 12 horas para cancelar ou remarcar.");
  }
}

function assertAppointmentIsConfirmed(appointment: Appointment, action: string) {
  if (appointment.status === "cancelled") {
    throw new DomainError(`Nao e possivel ${action} um agendamento cancelado.`);
  }

  if (appointment.status === "completed") {
    throw new DomainError(`Nao e possivel ${action} um agendamento concluido.`);
  }
}

function isRescheduleChange(appointment: Appointment, input: UpdateAppointmentInput) {
  const currentDate = appointment.startsAt.slice(0, 10);
  const currentTime = appointment.startsAt.slice(11, 16);

  if (input.date && input.date !== currentDate) {
    return true;
  }

  if (input.time && input.time !== currentTime) {
    return true;
  }

  return false;
}

function listAvailabilityEntries(
  data: AppData,
  barberId: string,
  prefix: string,
  now?: Date
) {
  const slotsByStart = new Map<string, AvailabilityView>();

  for (const slot of data.availability) {
    if (slot.barberId !== barberId || !slot.startsAt.startsWith(prefix)) {
      continue;
    }

    const appointment = data.appointments.find(
      (item) =>
        item.barberId === barberId &&
        item.startsAt === slot.startsAt &&
        item.status !== "cancelled"
    );

    const bookableByTime = now
      ? diffHours(now, new Date(slot.startsAt)) >= MIN_BOOKING_NOTICE_HOURS
      : true;

    const current = slotsByStart.get(slot.startsAt);
    if (!current) {
      slotsByStart.set(slot.startsAt, {
        startsAt: slot.startsAt,
        enabled: slot.enabled,
        reserved: Boolean(appointment),
        available: slot.enabled && !appointment && bookableByTime
      });
      continue;
    }

    current.enabled = current.enabled && slot.enabled;
    current.reserved = current.reserved || Boolean(appointment);
    current.available = current.enabled && !current.reserved && bookableByTime;
  }

  return Array.from(slotsByStart.values()).sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

export function createAppointment(data: AppData, input: CreateAppointmentInput) {
  const startsAt = buildIso(input.date, input.time);
  const startsDate = new Date(startsAt);

  if (!isWithinBusinessHours(startsDate)) {
    throw new DomainError("Horario fora da janela global da barbearia.");
  }

  if (diffHours(input.now, startsDate) < MIN_BOOKING_NOTICE_HOURS) {
    throw new DomainError("Agendamento precisa ser realizado com no minimo 2 horas de antecedencia.");
  }

  assertServiceActive(getService(data, input.serviceId));
  getBarberService(data, input.barberId, input.serviceId);

  const slot = findAvailabilitySlot(data, input.barberId, startsAt);
  if (!slot?.enabled) {
    throw new DomainError("Horario indisponivel para o barbeiro.");
  }

  const hasConflict = data.appointments.some(
    (item) =>
      item.barberId === input.barberId &&
      item.startsAt === startsAt &&
      item.status !== "cancelled"
  );

  if (hasConflict) {
    throw new DomainError("Ja existe um agendamento neste horario para o barbeiro.");
  }

  const clientId =
    input.actor.role === "client" ? getClientIdForActor(data, input.actor) : input.clientId;
  assertClientExists(data, clientId);

  const appointment: Appointment = {
    id: `apt_${data.appointments.length + 1}`,
    clientId,
    barberId: input.barberId,
    serviceId: input.serviceId,
    startsAt,
    endsAt: toBrasiliaIso(addMinutes(startsDate, APPOINTMENT_DURATION_MINUTES)),
    status: "confirmed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  };

  data.appointments.push(appointment);
  return appointment;
}

export function updateAppointment(data: AppData, input: UpdateAppointmentInput) {
  const appointment = data.appointments.find((item) => item.id === input.appointmentId);
  if (!appointment) {
    throw new DomainError("Agendamento nao encontrado.");
  }

  assertAppointmentIsConfirmed(appointment, "alterar");

  if (input.actor.role !== "admin" && input.actor.role !== "barber") {
    throw new DomainError("Somente barbeiro ou administrador podem alterar agendamentos.");
  }

  assertAppointmentOwnership(data, input.actor, appointment);
  const hoursUntil = diffHours(input.now, new Date(appointment.startsAt));
  const isReschedule = isRescheduleChange(appointment, input);
  const isServiceChange = Boolean(input.serviceId && input.serviceId !== appointment.serviceId);

  if (isReschedule) {
    assertAppointmentManagement(input.actor.role, hoursUntil);
  }

  if (input.serviceId) {
    if (input.actor.role !== "admin" && input.actor.role !== "barber") {
      throw new DomainError("Somente barbeiro ou administrador podem alterar o servico.");
    }

    assertServiceActive(getService(data, input.serviceId));
    getBarberService(data, appointment.barberId, input.serviceId);
    appointment.serviceId = input.serviceId;
  }

  if (input.date || input.time) {
    const nextDate = input.date ?? appointment.startsAt.slice(0, 10);
    const nextTime = input.time ?? appointment.startsAt.slice(11, 16);
    const nextStartsAt = buildIso(nextDate, nextTime);
    const nextStartDate = new Date(nextStartsAt);

    if (!isWithinBusinessHours(nextStartDate)) {
      throw new DomainError("Horario fora da janela global da barbearia.");
    }

    const slot = findAvailabilitySlot(data, appointment.barberId, nextStartsAt);
    if (!slot?.enabled) {
      throw new DomainError("Horario indisponivel para o barbeiro.");
    }

    const hasConflict = data.appointments.some(
      (item) =>
        item.id !== appointment.id &&
        item.barberId === appointment.barberId &&
        item.startsAt === nextStartsAt &&
        item.status !== "cancelled"
    );

    if (hasConflict) {
      throw new DomainError("Ja existe um agendamento neste horario para o barbeiro.");
    }

    appointment.startsAt = nextStartsAt;
    appointment.endsAt = toBrasiliaIso(addMinutes(nextStartDate, APPOINTMENT_DURATION_MINUTES));
    appointment.paid = false;
    appointment.paidAt = null;
  }

  if (isReschedule || isServiceChange) {
    appointment.rescheduledAt = input.now.toISOString();
    appointment.rescheduledByRole = input.actor.role;
  }

  return appointment;
}

export function cancelAppointment(data: AppData, input: ChangeAppointmentStatusInput) {
  const appointment = data.appointments.find((item) => item.id === input.appointmentId);
  if (!appointment) {
    throw new DomainError("Agendamento nao encontrado.");
  }

  assertAppointmentOwnership(data, input.actor, appointment);
  assertAppointmentIsConfirmed(appointment, "cancelar");
  const hoursUntil = diffHours(input.now, new Date(appointment.startsAt));
  assertAppointmentManagement(input.actor.role, hoursUntil);

  appointment.status = "cancelled";
  appointment.paid = false;
  appointment.paidAt = null;

  return appointment;
}

export function completeAppointment(data: AppData, input: ChangeAppointmentStatusInput) {
  if (input.actor.role !== "barber" && input.actor.role !== "admin") {
    throw new DomainError("Somente barbeiro ou administrador podem concluir atendimento.");
  }

  const appointment = data.appointments.find((item) => item.id === input.appointmentId);
  if (!appointment) {
    throw new DomainError("Agendamento nao encontrado.");
  }

  assertAppointmentOwnership(data, input.actor, appointment);
  assertAppointmentIsConfirmed(appointment, "concluir");

  if (input.now < new Date(appointment.startsAt)) {
    throw new DomainError("Atendimento so pode ser concluido apos o inicio do horario agendado.");
  }

  appointment.status = "completed";
  return appointment;
}

export function registerPayment(data: AppData, input: ChangeAppointmentStatusInput) {
  if (input.actor.role !== "barber" && input.actor.role !== "admin") {
    throw new DomainError("Somente barbeiro ou administrador podem registrar pagamento.");
  }

  const appointment = data.appointments.find((item) => item.id === input.appointmentId);
  if (!appointment) {
    throw new DomainError("Agendamento nao encontrado.");
  }

  assertAppointmentOwnership(data, input.actor, appointment);
  if (appointment.status !== "completed") {
    throw new DomainError("Pagamento so pode ser registrado ao final do atendimento.");
  }

  if (appointment.paid) {
    throw new DomainError("Pagamento ja registrado para este agendamento.");
  }

  appointment.paid = true;
  appointment.paidAt = input.now.toISOString();
  return appointment;
}

export function deleteAppointment(data: AppData, input: ChangeAppointmentStatusInput) {
  if (input.actor.role !== "admin") {
    throw new DomainError("Somente administrador pode excluir agendamento.");
  }

  const index = data.appointments.findIndex((item) => item.id === input.appointmentId);
  if (index === -1) {
    throw new DomainError("Agendamento nao encontrado.");
  }

  const [removed] = data.appointments.splice(index, 1);
  return removed;
}

export function toggleAvailability(data: AppData, input: ToggleAvailabilityInput) {
  if (input.actor.role !== "barber" && input.actor.role !== "admin") {
    throw new DomainError("Somente barbeiro ou administrador podem alterar disponibilidade.");
  }

  if (input.actor.role === "barber") {
    const actorBarber = data.barbers.find((item) => item.userId === input.actor.id);
    if (actorBarber?.id !== input.barberId) {
      throw new DomainError("Barbeiro so pode alterar a propria disponibilidade.");
    }
  }

  const startsAt = buildIso(input.date, input.time);
  const hasAppointment = data.appointments.some(
    (item) =>
      item.barberId === input.barberId &&
      item.startsAt === startsAt &&
      item.status !== "cancelled"
  );

  if (hasAppointment && !input.enabled) {
    throw new DomainError("Horario com agendamento nao pode ser desativado.");
  }

  let slot = findAvailabilitySlot(data, input.barberId, startsAt);

  if (!slot) {
    slot = {
      barberId: input.barberId,
      startsAt,
      enabled: input.enabled
    } satisfies AvailabilitySlot;
    data.availability.push(slot);
  } else {
    slot.enabled = input.enabled;
  }

  return slot;
}

export function listAvailability(data: AppData, barberId: string, date: string) {
  return listAvailabilityEntries(data, barberId, date);
}

export function listBookableAvailability(data: AppData, barberId: string, date: string, now: Date) {
  return listAvailabilityEntries(data, barberId, date, now);
}

export function listBookableAvailabilityMonth(
  data: AppData,
  barberId: string,
  month: string,
  now: Date
) {
  const availability = listAvailabilityEntries(data, barberId, month, now);
  const days = new Map<string, number>();

  for (const slot of availability) {
    const date = slot.startsAt.slice(0, 10);
    const current = days.get(date) ?? 0;
    days.set(date, slot.available ? current + 1 : current);
  }

  return Array.from(days.entries())
    .map(([date, availableCount]) => ({ date, availableCount }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function buildFinancialSummary(data: AppData, startDate: string, endDate: string) {
  const validAppointments = data.appointments.filter((item) => {
    const day = item.startsAt.slice(0, 10);
    return day >= startDate && day <= endDate && item.status !== "cancelled";
  });

  const predicted = validAppointments.reduce((sum, appointment) => {
    const service = getService(data, appointment.serviceId);
    return sum + service.priceInCents;
  }, 0);

  const received = validAppointments.reduce((sum, appointment) => {
    if (!appointment.paid) {
      return sum;
    }

    const service = getService(data, appointment.serviceId);
    return sum + service.priceInCents;
  }, 0);

  return {
    appointments: validAppointments.length,
    predictedInCents: predicted,
    predictedLabel: formatCurrencyFromCents(predicted),
    receivedInCents: received,
    receivedLabel: formatCurrencyFromCents(received)
  };
}
