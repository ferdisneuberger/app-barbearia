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

export type FinancialBarberSummary = {
  barberId: string;
  barberName: string;
  appointments: number;
  paidAppointments: number;
  pendingAppointments: number;
  grossPredictedLabel: string;
  grossReceivedLabel: string;
  shopPredictedLabel: string;
  shopReceivedLabel: string;
  barberPredictedLabel: string;
  barberReceivedLabel: string;
};

export type FinancialEntry = {
  appointmentId: string;
  startsAt: string;
  paidAt: string | null;
  status: string;
  paid: boolean;
  clientName: string;
  barberId: string;
  barberName: string;
  serviceName: string;
  grossLabel: string;
  shopLabel: string;
  barberLabel: string;
};

export type FinancialSummary = {
  appointments: number;
  paidAppointments: number;
  pendingAppointments: number;
  grossPredictedLabel: string;
  grossReceivedLabel: string;
  shopPredictedLabel: string;
  shopReceivedLabel: string;
  barberPredictedLabel: string;
  barberReceivedLabel: string;
  byBarber: FinancialBarberSummary[];
  entries: FinancialEntry[];
};

export type AppointmentCompletionRule = "after_start" | "anytime";

export type BusinessRules = {
  appointmentCompletionRule: AppointmentCompletionRule;
  barberCancellationHours: number;
  clientCancellationHours: number;
  clientBookingNoticeHours: number;
};

export type ActionModalState = {
  appointment: Appointment;
  date: string;
  time: string;
  serviceId: string;
  availability: Availability[];
};

export type BootstrapPayload = {
  admins: User[];
  barbers: Barber[];
  clients: Client[];
  services: Service[];
  businessRules: BusinessRules;
};
