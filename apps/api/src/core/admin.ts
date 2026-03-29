import type { AppData, BusinessRules, Role, User } from "../domain/types.ts";
import { DomainError } from "./booking.ts";
import { createId } from "./id.ts";
import { normalizeBusinessRules } from "./rules.ts";
import { buildIso, createDailySlotTimes } from "./time.ts";

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
  role: Role,
  input: { name: string; email: string; password: string }
) {
  if (!input.name.trim() || !input.email.trim() || !input.password.trim()) {
    throw new DomainError("Nome, e-mail e senha sao obrigatorios.");
  }

  assertUniqueEmail(data, input.email);

  return {
    id: createId(),
    name: input.name,
    email: input.email,
    password: input.password,
    role
  } satisfies User;
}

export function createServiceByAdmin(
  data: AppData,
  actor: User,
  input: {
    name: string;
    priceInCents: number;
    assignToAllBarbers?: boolean;
    barberIds?: string[];
  }
) {
  assertAdmin(actor);

  const service = {
    id: createId(),
    name: input.name,
    priceInCents: input.priceInCents,
    active: true
  };

  data.services.push(service);
  applyServiceAssignment(data, service.id, input.assignToAllBarbers ?? false, input.barberIds ?? []);
  return service;
}

export function createClientByAdmin(
  data: AppData,
  actor: User,
  input: { name: string; email: string; password: string }
) {
  assertAdmin(actor);

  const user = createUser(data, "client", input);
  const client = {
    id: createId(),
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
  const user = createUser(data, "client", input);
  const client = {
    id: createId(),
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

  const user = createUser(data, "barber", input);
  const barber = {
    id: createId(),
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

export function createAdminByAdmin(
  data: AppData,
  actor: User,
  input: { name: string; email: string; password: string }
) {
  assertAdmin(actor);

  const user = createUser(data, "admin", input);
  data.users.push(user);

  return user;
}

export function updateServiceByAdmin(
  data: AppData,
  actor: User,
  serviceId: string,
  input: {
    name?: string;
    priceInCents?: number;
    active?: boolean;
    assignToAllBarbers?: boolean;
    barberIds?: string[];
  }
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

  if (input.assignToAllBarbers !== undefined || input.barberIds !== undefined) {
    applyServiceAssignment(
      data,
      serviceId,
      input.assignToAllBarbers ?? false,
      input.barberIds ?? []
    );
  }

  return service;
}

export function deleteServiceByAdmin(data: AppData, actor: User, serviceId: string) {
  assertAdmin(actor);

  if (data.appointments.some((appointment) => appointment.serviceId === serviceId)) {
    throw new DomainError("Nao e possivel excluir um servico que ja possui agendamentos.");
  }

  const nextServices = data.services.filter((service) => service.id !== serviceId);
  if (nextServices.length === data.services.length) {
    throw new DomainError("Servico nao encontrado.");
  }

  data.services = nextServices;
  for (const barber of data.barbers) {
    barber.serviceIds = barber.serviceIds.filter((currentServiceId) => currentServiceId !== serviceId);
  }
}

export function updateBusinessRulesByAdmin(
  data: AppData,
  actor: User,
  input: Partial<BusinessRules>
) {
  assertAdmin(actor);

  const normalized = normalizeBusinessRules({
    ...data.businessRules,
    ...input
  });

  data.businessRules = normalized;
  return normalized;
}

export function deleteClientByAdmin(data: AppData, actor: User, clientId: string) {
  assertAdmin(actor);

  const client = data.clients.find((item) => item.id === clientId);
  if (!client) {
    throw new DomainError("Cliente nao encontrado.");
  }

  if (data.appointments.some((appointment) => appointment.clientId === clientId)) {
    throw new DomainError("Nao e possivel excluir um cliente que possui agendamentos.");
  }

  data.clients = data.clients.filter((item) => item.id !== clientId);
  data.users = data.users.filter((user) => user.id !== client.userId);
}

export function deleteBarberByAdmin(data: AppData, actor: User, barberId: string) {
  assertAdmin(actor);

  const barber = data.barbers.find((item) => item.id === barberId);
  if (!barber) {
    throw new DomainError("Barbeiro nao encontrado.");
  }

  if (data.appointments.some((appointment) => appointment.barberId === barberId)) {
    throw new DomainError("Nao e possivel excluir um barbeiro que possui agendamentos.");
  }

  data.barbers = data.barbers.filter((item) => item.id !== barberId);
  data.availability = data.availability.filter((slot) => slot.barberId !== barberId);
  data.users = data.users.filter((user) => user.id !== barber.userId);
}

export function deleteAdminByAdmin(data: AppData, actor: User, adminId: string) {
  assertAdmin(actor);

  const admin = data.users.find((item) => item.id === adminId && item.role === "admin");
  if (!admin) {
    throw new DomainError("Administrador nao encontrado.");
  }

  if (admin.id === actor.id) {
    throw new DomainError("Nao e possivel excluir o proprio usuario administrador.");
  }

  const adminCount = data.users.filter((user) => user.role === "admin").length;
  if (adminCount <= 1) {
    throw new DomainError("Nao e possivel excluir o ultimo administrador.");
  }

  data.users = data.users.filter((user) => user.id !== admin.id);
}

function applyServiceAssignment(
  data: AppData,
  serviceId: string,
  assignToAllBarbers: boolean,
  barberIds: string[]
) {
  const allowedBarberIds = new Set(assignToAllBarbers ? data.barbers.map((barber) => barber.id) : barberIds);

  for (const barber of data.barbers) {
    const hasService = barber.serviceIds.includes(serviceId);
    const shouldHaveService = allowedBarberIds.has(barber.id);

    if (shouldHaveService && !hasService) {
      barber.serviceIds.push(serviceId);
    }

    if (!shouldHaveService && hasService) {
      barber.serviceIds = barber.serviceIds.filter((currentServiceId) => currentServiceId !== serviceId);
    }
  }
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
