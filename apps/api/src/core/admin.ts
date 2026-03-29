import type { AppData, Role, User } from "../domain/types.ts";
import { DomainError } from "./booking.ts";
import { buildIso, createDailySlotTimes } from "./time.ts";

function nextId(prefix: string, values: string[]) {
  let counter = values.length + 1;
  let candidate = `${prefix}_${counter}`;

  while (values.includes(candidate)) {
    counter += 1;
    candidate = `${prefix}_${counter}`;
  }

  return candidate;
}

function assertAdmin(actor: User) {
  if (actor.role !== "admin") {
    throw new DomainError("Apenas administradores podem acessar este recurso.");
  }
}

function assertUniqueEmail(data: AppData, email: string) {
  if (data.users.some((user) => user.email === email)) {
    throw new DomainError("Ja existe um usuario com este e-mail.");
  }
}

function createUser(
  data: AppData,
  prefix: string,
  role: Role,
  input: { name: string; email: string; password: string }
) {
  if (!input.name.trim() || !input.email.trim() || !input.password.trim()) {
    throw new DomainError("Nome, e-mail e senha sao obrigatorios.");
  }

  assertUniqueEmail(data, input.email);

  return {
    id: nextId(
      prefix,
      data.users.map((item) => item.id)
    ),
    name: input.name,
    email: input.email,
    password: input.password,
    role
  } satisfies User;
}

export function createServiceByAdmin(
  data: AppData,
  actor: User,
  input: { name: string; priceInCents: number }
) {
  assertAdmin(actor);

  const service = {
    id: nextId(
      "srv",
      data.services.map((item) => item.id)
    ),
    name: input.name,
    priceInCents: input.priceInCents,
    active: true
  };

  data.services.push(service);
  return service;
}

export function createClientByAdmin(
  data: AppData,
  actor: User,
  input: { name: string; email: string; password: string }
) {
  assertAdmin(actor);

  const user = createUser(data, "usr_client", "client", input);
  const client = {
    id: nextId(
      "cli",
      data.clients.map((item) => item.id)
    ),
    userId: user.id
  };

  data.users.push(user);
  data.clients.push(client);

  return {
    ...client,
    name: user.name,
    email: user.email
  };
}

export function createPublicClient(
  data: AppData,
  input: { name: string; email: string; password: string }
) {
  const user = createUser(data, "usr_client", "client", input);
  const client = {
    id: nextId(
      "cli",
      data.clients.map((item) => item.id)
    ),
    userId: user.id
  };

  data.users.push(user);
  data.clients.push(client);

  return user;
}

export function createBarberByAdmin(
  data: AppData,
  actor: User,
  input: { name: string; email: string; password: string; serviceIds: string[] }
) {
  assertAdmin(actor);

  const user = createUser(data, "usr_barber", "barber", input);
  const barber = {
    id: nextId(
      "bar",
      data.barbers.map((item) => item.id)
    ),
    userId: user.id,
    serviceIds: input.serviceIds
  };

  data.users.push(user);
  data.barbers.push(barber);
  data.availability.push(...createDefaultBarberAvailability(barber.id));

  return {
    ...barber,
    name: user.name,
    email: user.email
  };
}

export function updateServiceByAdmin(
  data: AppData,
  actor: User,
  serviceId: string,
  input: { name?: string; priceInCents?: number; active?: boolean }
) {
  assertAdmin(actor);

  const service = data.services.find((item) => item.id === serviceId);
  if (!service) {
    throw new DomainError("Servico nao encontrado.");
  }

  if (input.name !== undefined) {
    service.name = input.name;
  }

  if (input.priceInCents !== undefined) {
    service.priceInCents = input.priceInCents;
  }

  if (input.active !== undefined) {
    service.active = input.active;
  }

  return service;
}

export function createDefaultBarberAvailability(barberId: string) {
  const slots = createDailySlotTimes();
  const availability = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 366; dayOffset += 1) {
    const current = new Date(today.getTime());
    current.setDate(today.getDate() + dayOffset);
    const weekDay = current.getDay();

    if (weekDay === 0 || weekDay === 6) {
      continue;
    }

    const year = current.getFullYear();
    const month = `${current.getMonth() + 1}`.padStart(2, "0");
    const day = `${current.getDate()}`.padStart(2, "0");
    const date = `${year}-${month}-${day}`;

    for (const time of slots) {
      availability.push({
        barberId,
        startsAt: buildIso(date, time),
        enabled: true
      });
    }
  }

  return availability;
}
