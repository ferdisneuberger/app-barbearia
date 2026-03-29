import type {
  Appointment,
  Availability,
  Barber,
  BookingDayAvailability,
  BootstrapPayload,
  BusinessRules,
  Client,
  FinancialSummary,
  Service,
  User
} from "./types";

function resolveApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (globalThis.window !== undefined) {
    return `${globalThis.window.location.protocol}//${globalThis.window.location.hostname}:3001`;
  }

  return "http://localhost:3001";
}

const apiUrl = resolveApiUrl();
const CSRF_COOKIE_NAME = "barbearia.csrf_token";

function getCsrfToken() {
  if (globalThis.document === undefined) {
    return "";
  }

  const cookies = globalThis.document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      return rest.join("=");
    }
  }

  return "";
}

function isUnsafeMethod(method?: string) {
  return method !== undefined && !["GET", "HEAD", "OPTIONS"].includes(method);
}

export function createApiClient(getAccessToken?: () => string | null, setAccessToken?: (value: string | null) => void) {
  async function doRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers)
    };

    const accessToken = getAccessToken?.();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    if (isUnsafeMethod(init?.method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
    }

    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      credentials: "include",
      headers
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await response.json()) as T & { message?: string };
    if (!response.ok) {
      throw new Error(data.message ?? "Erro inesperado.");
    }

    return data;
  }

  async function request<T>(path: string, init?: RequestInit, allowRefresh = true): Promise<T> {
    try {
      return await doRequest<T>(path, init);
    } catch (error) {
      const message = (error as Error).message;
      const isAuthPath =
        path === "/auth/login" ||
        path === "/auth/register" ||
        path === "/auth/logout" ||
        path === "/auth/refresh";

      const shouldTryRefresh =
        message === "Usuario nao autenticado." || message === "Token expirado.";

      if (!allowRefresh || isAuthPath || !shouldTryRefresh) {
        throw error;
      }

      const refreshData = await doRequest<{ accessToken?: string }>("/auth/refresh", { method: "POST" });
      if (refreshData.accessToken) {
        setAccessToken?.(refreshData.accessToken);
      }
      return doRequest<T>(path, init);
    }
  }

  return {
    request,
    login(email: string, password: string) {
      return request<{ user: User; accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
    },
    register(name: string, email: string, password: string) {
      return request<{ user: User; accessToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
    },
    logout() {
      return request<void>("/auth/logout", { method: "POST" });
    },
    me() {
      return request<{ user: User }>("/auth/me");
    },
    loadBootstrap() {
      return request<BootstrapPayload>("/bootstrap");
    },
    loadAppointments(date?: string) {
      const search = date ? `?date=${date}` : "";
      return request<Appointment[]>(`/appointments${search}`);
    },
    loadAvailability(barberId: string, date: string) {
      return request<Availability[]>(`/availability?barberId=${barberId}&date=${date}`);
    },
    loadAvailabilityMonth(barberId: string, month: string) {
      return request<BookingDayAvailability[]>(`/availability/month?barberId=${barberId}&month=${month}`);
    },
    loadBookableAvailability(barberId: string, date: string) {
      return request<Availability[]>(`/availability/booking?barberId=${barberId}&date=${date}`);
    },
    loadBookableAvailabilityMonth(barberId: string, month: string) {
      return request<BookingDayAvailability[]>(
        `/availability/booking/month?barberId=${barberId}&month=${month}`
      );
    },
    loadFinancial(startDate: string, endDate: string) {
      return request<FinancialSummary>(
        `/financial-summary?startDate=${startDate}&endDate=${endDate}`
      );
    },
    updateBusinessRules(payload: BusinessRules) {
      return request<BusinessRules>("/business-rules", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    },
    createAppointment(payload: {
      clientId: string;
      barberId: string;
      serviceId: string;
      date: string;
      time: string;
    }) {
      return request("/appointments", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    updateAppointment(appointmentId: string, payload: {
      serviceId?: string;
      date?: string;
      time?: string;
    }) {
      return request(`/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    },
    cancelAppointment(appointmentId: string) {
      return request(`/appointments/${appointmentId}/cancel`, { method: "PATCH" });
    },
    completeAppointment(appointmentId: string) {
      return request(`/appointments/${appointmentId}/complete`, { method: "PATCH" });
    },
    payAppointment(appointmentId: string) {
      return request(`/appointments/${appointmentId}/pay`, { method: "PATCH" });
    },
    deleteAppointment(appointmentId: string) {
      return request(`/appointments/${appointmentId}`, { method: "DELETE" });
    },
    toggleAvailability(payload: {
      barberId: string;
      date: string;
      time: string;
      enabled: boolean;
    }) {
      return request("/availability", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    },
    createService(payload: {
      name: string;
      priceInCents: number;
      assignToAllBarbers?: boolean;
      barberIds?: string[];
    }) {
      return request<Service>("/services", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    updateService(serviceId: string, payload: {
      name?: string;
      priceInCents?: number;
      active?: boolean;
      assignToAllBarbers?: boolean;
      barberIds?: string[];
    }) {
      return request<Service>(`/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    },
    deleteService(serviceId: string) {
      return request<void>(`/services/${serviceId}`, { method: "DELETE" });
    },
    createClient(payload: { name: string; email: string; password: string }) {
      return request<Client>("/clients", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    deleteClient(clientId: string) {
      return request<void>(`/clients/${clientId}`, { method: "DELETE" });
    },
    createBarber(payload: {
      name: string;
      email: string;
      password: string;
      serviceIds: string[];
    }) {
      return request<Barber>("/barbers", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    deleteBarber(barberId: string) {
      return request<void>(`/barbers/${barberId}`, { method: "DELETE" });
    },
    createAdmin(payload: { name: string; email: string; password: string }) {
      return request<User>("/admins", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    deleteAdmin(adminId: string) {
      return request<void>(`/admins/${adminId}`, { method: "DELETE" });
    }
  };
}
