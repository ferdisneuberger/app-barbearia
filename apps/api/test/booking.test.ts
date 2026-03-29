import test from "node:test";
import assert from "node:assert/strict";
import {
  cancelAppointment,
  completeAppointment,
  createAppointment,
  DomainError,
  listBookableAvailability,
  listBookableAvailabilityMonth,
  listAvailability,
  registerPayment,
  toggleAvailability,
  updateAppointment
} from "../src/core/booking.ts";
import type { AppData, User } from "../src/domain/types.ts";
import { addMinutes, buildIso, toBrasiliaIso } from "../src/core/time.ts";

function makeData(): AppData {
  return {
    users: [
      {
        id: "usr_admin",
        name: "Admin",
        email: "admin@test",
        password: "123",
        role: "admin"
      },
      {
        id: "usr_barber",
        name: "Barbeiro",
        email: "barber@test",
        password: "123",
        role: "barber"
      },
      {
        id: "usr_client",
        name: "Cliente",
        email: "client@test",
        password: "123",
        role: "client"
      }
    ],
    clients: [{ id: "cli_1", userId: "usr_client" }],
    barbers: [{ id: "bar_1", userId: "usr_barber", serviceIds: ["srv_1"] }],
    services: [{ id: "srv_1", name: "Cabelo", priceInCents: 3000, active: true }],
    appointments: [],
    availability: [
      {
        barberId: "bar_1",
        startsAt: buildIso("2026-04-01", "10:15"),
        enabled: true
      }
    ]
  };
}

function getUser(data: AppData, role: User["role"]) {
  const user = data.users.find((item) => item.role === role);
  assert.ok(user);
  return user;
}

test("cria agendamento confirmado quando horario esta disponivel", () => {
  const data = makeData();

  const appointment = createAppointment(data, {
    actor: getUser(data, "client"),
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    date: "2026-04-01",
    time: "10:15",
    now: new Date("2026-04-01T06:00:00-03:00")
  });

  assert.equal(appointment.status, "confirmed");
  assert.equal(appointment.startsAt, "2026-04-01T10:15:00-03:00");
  assert.equal(data.appointments.length, 1);
});

test("impede agendamento com menos de 2 horas de antecedencia", () => {
  const data = makeData();

  assert.throws(
    () =>
      createAppointment(data, {
        actor: getUser(data, "client"),
        clientId: "cli_1",
        barberId: "bar_1",
        serviceId: "srv_1",
        date: "2026-04-01",
        time: "10:15",
        now: new Date("2026-04-01T09:00:00-03:00")
      }),
    DomainError
  );
});

test("cliente nao cancela com menos de 3 horas", () => {
  const data = makeData();

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "confirmed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  assert.throws(
    () =>
      cancelAppointment(data, {
        actor: getUser(data, "client"),
        appointmentId: "apt_1",
        now: new Date("2026-04-01T08:00:01-03:00")
      }),
    DomainError
  );
});

test("admin pode cancelar a qualquer momento", () => {
  const data = makeData();

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "confirmed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  const appointment = cancelAppointment(data, {
    actor: getUser(data, "admin"),
    appointmentId: "apt_1",
    now: new Date("2026-04-01T10:00:00-03:00")
  });

  assert.equal(appointment.status, "cancelled");
});

test("barbeiro nao pode desativar horario com agendamento", () => {
  const data = makeData();

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "confirmed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  assert.throws(
    () =>
      toggleAvailability(data, {
        actor: getUser(data, "barber"),
        barberId: "bar_1",
        date: "2026-04-01",
        time: "10:15",
        enabled: false
      }),
    DomainError
  );
});

test("admin consegue reagendar mantendo horario local de brasilia", () => {
  const data = makeData();

  data.availability.push({
    barberId: "bar_1",
    startsAt: buildIso("2026-04-01", "11:00"),
    enabled: true
  });

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "confirmed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  const appointment = updateAppointment(data, {
    actor: getUser(data, "admin"),
    appointmentId: "apt_1",
    date: "2026-04-01",
    time: "11:00",
    now: new Date("2026-04-01T08:00:00-03:00")
  });

  assert.equal(appointment.startsAt, "2026-04-01T11:00:00-03:00");
});

test("barbeiro pode alterar apenas o servico sem cair na regra de 12 horas", () => {
  const data = makeData();

  data.services.push({ id: "srv_2", name: "Barba", priceInCents: 2000, active: true });
  data.barbers[0]?.serviceIds.push("srv_2");
  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "confirmed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  const appointment = updateAppointment(data, {
    actor: getUser(data, "barber"),
    appointmentId: "apt_1",
    serviceId: "srv_2",
    date: "2026-04-01",
    time: "10:15",
    now: new Date("2026-04-01T09:30:00-03:00")
  });

  assert.equal(appointment.serviceId, "srv_2");
  assert.equal(appointment.startsAt, buildIso("2026-04-01", "10:15"));
  assert.equal(appointment.rescheduledByRole, "barber");
  assert.equal(appointment.rescheduledAt, new Date("2026-04-01T09:30:00-03:00").toISOString());
});

test("nao permite cancelar agendamento concluido", () => {
  const data = makeData();

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "completed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  assert.throws(
    () =>
      cancelAppointment(data, {
        actor: getUser(data, "admin"),
        appointmentId: "apt_1",
        now: new Date("2026-04-01T11:00:00-03:00")
      }),
    DomainError
  );
});

test("nao permite concluir agendamento cancelado", () => {
  const data = makeData();

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "cancelled",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  assert.throws(
    () =>
      completeAppointment(data, {
        actor: getUser(data, "admin"),
        appointmentId: "apt_1",
        now: new Date("2026-04-01T11:00:00-03:00")
      }),
    DomainError
  );
});

test("nao permite concluir atendimento antes do inicio do horario agendado", () => {
  const data = makeData();

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "confirmed",
    paid: false,
    paidAt: null,
    rescheduledAt: null,
    rescheduledByRole: null
  });

  assert.throws(
    () =>
      completeAppointment(data, {
        actor: getUser(data, "barber"),
        appointmentId: "apt_1",
        now: new Date("2026-04-01T10:00:00-03:00")
      }),
    DomainError
  );
});

test("nao permite registrar pagamento duas vezes", () => {
  const data = makeData();

  data.appointments.push({
    id: "apt_1",
    clientId: "cli_1",
    barberId: "bar_1",
    serviceId: "srv_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    endsAt: toBrasiliaIso(addMinutes(new Date(buildIso("2026-04-01", "10:15")), 45)),
    status: "completed",
    paid: true,
    paidAt: new Date("2026-04-01T11:15:00-03:00").toISOString(),
    rescheduledAt: null,
    rescheduledByRole: null
  });

  assert.throws(
    () =>
      registerPayment(data, {
        actor: getUser(data, "admin"),
        appointmentId: "apt_1",
        now: new Date("2026-04-01T11:30:00-03:00")
      }),
    DomainError
  );
});

test("lista disponibilidade com available vindo da api e respeita indisponibilidade", () => {
  const data = makeData();

  data.availability.push({
    barberId: "bar_1",
    startsAt: buildIso("2026-04-01", "10:15"),
    enabled: false
  });

  const availability = listAvailability(data, "bar_1", "2026-04-01");
  assert.equal(availability.length, 1);
  assert.equal(availability[0]?.enabled, false);
  assert.equal(availability[0]?.reserved, false);
  assert.equal(availability[0]?.available, false);
});

test("lista horarios bookable respeitando antecedencia minima", () => {
  const data = makeData();

  const availability = listBookableAvailability(
    data,
    "bar_1",
    "2026-04-01",
    new Date("2026-04-01T09:00:00-03:00")
  );

  assert.equal(availability[0]?.available, false);
});

test("resume disponibilidade mensal bookable por dia", () => {
  const data = makeData();

  const summary = listBookableAvailabilityMonth(
    data,
    "bar_1",
    "2026-04",
    new Date("2026-04-01T06:00:00-03:00")
  );

  assert.equal(summary[0]?.date, "2026-04-01");
  assert.equal(summary[0]?.availableCount, 1);
});
