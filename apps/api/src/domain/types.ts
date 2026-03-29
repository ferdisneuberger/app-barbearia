export type Role = "client" | "barber" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type Service = {
  id: string;
  name: string;
  priceInCents: number;
  active: boolean;
};

export type Barber = {
  id: string;
  userId: string;
  serviceIds: string[];
};

export type Client = {
  id: string;
  userId: string;
};

export type AppointmentStatus = "confirmed" | "cancelled" | "completed";

export type Appointment = {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  paid: boolean;
  paidAt: string | null;
  rescheduledAt: string | null;
  rescheduledByRole: Role | null;
};

export type AvailabilitySlot = {
  barberId: string;
  startsAt: string;
  enabled: boolean;
};

export type AppointmentCompletionRule = "after_start" | "anytime";

export type BusinessRules = {
  appointmentCompletionRule: AppointmentCompletionRule;
  barberCancellationHours: number;
  clientCancellationHours: number;
  clientBookingNoticeHours: number;
};

export type AppData = {
  users: User[];
  clients: Client[];
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  availability: AvailabilitySlot[];
  businessRules: BusinessRules;
};
