import type { AppData, User } from "../domain/types.ts";
import { DomainError } from "./booking.ts";

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function requireActor(data: AppData, actorId: string | null) {
  const actor = actorId ? data.users.find((user) => user.id === actorId) : null;

  if (!actor) {
    throw new DomainError("Usuario nao autenticado.");
  }

  return actor;
}

export function serializeBarbers(data: AppData) {
  return data.barbers.map((barber) => {
    const user = data.users.find((item) => item.id === barber.userId);
    return {
      id: barber.id,
      userId: barber.userId,
      name: user?.name ?? "Barbeiro",
      email: user?.email ?? "",
      serviceIds: barber.serviceIds
    };
  });
}

export function serializeClients(data: AppData) {
  return data.clients.map((client) => {
    const user = data.users.find((item) => item.id === client.userId);
    return {
      id: client.id,
      userId: client.userId,
      name: user?.name ?? "Cliente",
      email: user?.email ?? ""
    };
  });
}

function serializeAppointments(data: AppData) {
  return data.appointments
    .map((appointment) => {
      const client = data.clients.find((item) => item.id === appointment.clientId);
      const clientUser = data.users.find((item) => item.id === client?.userId);
      const barber = data.barbers.find((item) => item.id === appointment.barberId);
      const barberUser = data.users.find((item) => item.id === barber?.userId);
      const service = data.services.find((item) => item.id === appointment.serviceId);

      return {
        ...appointment,
        clientName: clientUser?.name ?? "Cliente",
        barberName: barberUser?.name ?? "Barbeiro",
        serviceName: service?.name ?? "Servico"
      };
    })
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

export function filterAppointments(
  data: AppData,
  actor: User,
  query: { barberId: string | null; clientId: string | null; date: string | null }
) {
  let appointments = serializeAppointments(data);

  if (actor.role === "client") {
    const client = data.clients.find((item) => item.userId === actor.id);
    appointments = appointments.filter((item) => item.clientId === client?.id);
  }

  if (actor.role === "barber") {
    const barber = data.barbers.find((item) => item.userId === actor.id);
    appointments = appointments.filter((item) => item.barberId === barber?.id);
  }

  if (query.barberId) {
    appointments = appointments.filter((item) => item.barberId === query.barberId);
  }

  if (query.clientId) {
    appointments = appointments.filter((item) => item.clientId === query.clientId);
  }

  if (query.date) {
    appointments = appointments.filter((item) => item.startsAt.startsWith(query.date));
  }

  return appointments;
}
