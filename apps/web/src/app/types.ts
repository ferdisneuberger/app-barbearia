export type Role = "client" | "barber" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Barber = {
  id: string;
  name: string;
  email: string;
  serviceIds: string[];
};

export type Client = {
  id: string;
  name: string;
  email: string;
};

export type Service = {
  id: string;
  name: string;
  priceInCents: number;
  active: boolean;
};

export type Appointment = {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  startsAt: string;
  status: string;
  paid: boolean;
  clientName: string;
  barberName: string;
  serviceName: string;
  rescheduledAt: string | null;
  rescheduledByRole: Role | null;
};

export type Availability = {
  startsAt: string;
  enabled: boolean;
  reserved: boolean;
  available: boolean;
};

export type BookingDayAvailability = {
  date: string;
  availableCount: number;
};

export type FinancialSummary = {
  appointments: number;
  predictedLabel: string;
  receivedLabel: string;
};

export type ActionModalState = {
  appointment: Appointment;
  date: string;
  time: string;
  serviceId: string;
  availability: Availability[];
};

export type BootstrapPayload = {
  barbers: Barber[];
  clients: Client[];
  services: Service[];
};
