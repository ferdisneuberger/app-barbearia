import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createApiClient } from "./api";
import type {
  ActionModalState,
  Appointment,
  Availability,
  Barber,
  BusinessRules,
  BookingDayAvailability,
  Client,
  FinancialSummary,
  Service,
  User
} from "./types";
import {
  formatTime,
  getCurrentMonthInSaoPaulo,
  getFirstDayOfCurrentMonthInSaoPaulo,
  getLastDayOfCurrentMonthInSaoPaulo,
  getTodayInSaoPaulo
} from "./utils";

const TOKEN_STORAGE_KEY = "barbearia.token";
const USER_STORAGE_KEY = "barbearia.user";
const DEFAULT_BUSINESS_RULES: BusinessRules = {
  appointmentCompletionRule: "after_start",
  barberCancellationHours: 12,
  clientCancellationHours: 3,
  clientBookingNoticeHours: 2
};

export function useBarbershopApp() {
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRules>(DEFAULT_BUSINESS_RULES);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [availabilityFeedback, setAvailabilityFeedback] = useState("");
  const [bookingAvailability, setBookingAvailability] = useState<Availability[]>([]);
  const [bookingMonthAvailability, setBookingMonthAvailability] = useState<BookingDayAvailability[]>([]);
  const [message, setMessage] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [bookingClientSearch, setBookingClientSearch] = useState("");
  const [bookingBarberSearch, setBookingBarberSearch] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => getTodayInSaoPaulo());
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingMonth, setBookingMonth] = useState(() => getCurrentMonthInSaoPaulo());
  const [adminScheduleScope, setAdminScheduleScope] = useState<"day" | "month">("day");
  const [adminMonth, setAdminMonth] = useState(() => getCurrentMonthInSaoPaulo());
  const [financialStartDate, setFinancialStartDate] = useState(() =>
    getFirstDayOfCurrentMonthInSaoPaulo()
  );
  const [financialEndDate, setFinancialEndDate] = useState(() =>
    getLastDayOfCurrentMonthInSaoPaulo()
  );
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [menuAppointmentId, setMenuAppointmentId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [adminView, setAdminView] = useState<"home" | "agendamento" | "administrativo" | "financeiro">("home");
  const [adminManagementView, setAdminManagementView] = useState<"services" | "clients" | "barbers" | "admins" | "rules">("services");
  const [barberView, setBarberView] = useState<"agenda" | "disponibilidade">("agenda");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminBarberFilter, setAdminBarberFilter] = useState("");
  const [adminServiceFilter, setAdminServiceFilter] = useState("");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("all");

  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("0");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceAssignmentMode, setServiceAssignmentMode] = useState<"all" | "selected">("all");
  const [serviceBarberIds, setServiceBarberIds] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [barberName, setBarberName] = useState("");
  const [barberEmail, setBarberEmail] = useState("");
  const [barberPassword, setBarberPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [barberServiceIds, setBarberServiceIds] = useState<string[]>([]);
  const [appointmentCompletionRule, setAppointmentCompletionRule] =
    useState<BusinessRules["appointmentCompletionRule"]>(DEFAULT_BUSINESS_RULES.appointmentCompletionRule);
  const [barberCancellationHours, setBarberCancellationHours] = useState(
    String(DEFAULT_BUSINESS_RULES.barberCancellationHours)
  );
  const [clientCancellationHours, setClientCancellationHours] = useState(
    String(DEFAULT_BUSINESS_RULES.clientCancellationHours)
  );
  const [clientBookingNoticeHours, setClientBookingNoticeHours] = useState(
    String(DEFAULT_BUSINESS_RULES.clientBookingNoticeHours)
  );
  const availabilityRequestRef = useRef(0);
  const availabilityFeedbackTimeoutRef = useRef<number | null>(null);
  const bookingAvailabilityRequestRef = useRef(0);
  const bookingMonthRequestRef = useRef(0);

  const api = useMemo(() => createApiClient(() => token), [token]);

  function resolveAvailableTimes(slots: Availability[]) {
    return slots
      .filter((slot) => slot.available)
      .map((slot) => formatTime(slot.startsAt))
      .sort((left, right) => left.localeCompare(right));
  }

  function formatCurrencyInput(value: string) {
    const digits = value.replace(/\D/g, "");
    const cents = Number(digits || "0");

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(cents / 100);
  }

  function resetServiceForm() {
    setEditingServiceId(null);
    setServiceName("");
    setServicePrice("0");
    setServiceAssignmentMode("all");
    setServiceBarberIds([]);
  }

  function persistSession(nextUser: User, nextToken: string) {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }

  function clearSession() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  function showAvailabilityFeedback(nextMessage: string) {
    setAvailabilityFeedback(nextMessage);

    if (availabilityFeedbackTimeoutRef.current !== null) {
      globalThis.clearTimeout(availabilityFeedbackTimeoutRef.current);
    }

    availabilityFeedbackTimeoutRef.current = globalThis.setTimeout(() => {
      setAvailabilityFeedback("");
      availabilityFeedbackTimeoutRef.current = null;
    }, 1800);
  }

  const activeServices = useMemo(() => services.filter((service) => service.active), [services]);

  const availableBarbers = useMemo(
    () => barbers.filter((barber) => barber.serviceIds.some((serviceId) => activeServices.some((service) => service.id === serviceId))),
    [barbers, activeServices]
  );

  const barberServices = useMemo(
    () =>
      activeServices.filter((service) =>
        barbers.find((item) => item.id === selectedBarberId)?.serviceIds.includes(service.id)
      ),
    [barbers, activeServices, selectedBarberId]
  );

  const filteredBookingClients = useMemo(() => {
    const search = bookingClientSearch.trim().toLowerCase();

    if (search.length === 0) {
      return clients;
    }

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(search) || client.email.toLowerCase().includes(search)
    );
  }, [bookingClientSearch, clients]);

  const filteredBookingBarbers = useMemo(() => {
    const search = bookingBarberSearch.trim().toLowerCase();

    if (search.length === 0) {
      return barbers;
    }

    return barbers.filter(
      (barber) =>
        barber.name.toLowerCase().includes(search) || barber.email.toLowerCase().includes(search)
    );
  }, [bookingBarberSearch, barbers]);

  const filteredBookingBarbersByService = useMemo(() => {
    const baseBarbers =
      selectedServiceId.length === 0
        ? filteredBookingBarbers
        : filteredBookingBarbers.filter((barber) => barber.serviceIds.includes(selectedServiceId));

    return baseBarbers;
  }, [filteredBookingBarbers, selectedServiceId]);

  function syncBookingClientSearch(clientId: string) {
    const selectedClient = clients.find((client) => client.id === clientId);
    setBookingClientSearch(selectedClient?.name ?? "");
  }

  function syncBookingBarberSearch(barberId: string) {
    const selectedBarber = barbers.find((barber) => barber.id === barberId);
    setBookingBarberSearch(selectedBarber?.name ?? "");
  }

  function resetBookingSelection(options?: { keepClient?: boolean }) {
    if (!options?.keepClient) {
      setSelectedClientId("");
      setBookingClientSearch("");
    }

    setSelectedServiceId("");
    setSelectedBarberId("");
    setBookingBarberSearch("");
    clearBookingAfterServiceChange();
  }

  function clearBookingAfterServiceChange() {
    setSelectedBarberId("");
    setBookingBarberSearch("");
    clearBookingAfterBarberChange();
  }

  function clearBookingAfterBarberChange() {
    setSelectedDate("");
    setSelectedTime("");
    setBookingAvailability([]);
    setBookingMonthAvailability([]);
    setBookingMonth(getCurrentMonthInSaoPaulo());
  }

  const availableTimes = useMemo(
    () => resolveAvailableTimes(availability),
    [availability]
  );

  const clientAvailableTimes = useMemo(
    () => resolveAvailableTimes(bookingAvailability),
    [bookingAvailability]
  );

  const modalTimes = useMemo(() => {
    if (!actionModal) {
      return [];
    }

    const currentAppointmentTime = formatTime(actionModal.appointment.startsAt);

    return Array.from(
      new Set(
        actionModal.availability
          .filter(
            (slot) =>
              (slot.available || formatTime(slot.startsAt) === currentAppointmentTime) &&
              (!slot.reserved || formatTime(slot.startsAt) === currentAppointmentTime)
          )
          .map((slot) => formatTime(slot.startsAt))
      )
    ).sort((left, right) => left.localeCompare(right));
  }, [actionModal]);

  function sortAppointmentsWithCancelledLast(items: Appointment[]) {
    return [...items].sort((left, right) => {
      if (left.status === "cancelled" && right.status !== "cancelled") {
        return 1;
      }

      if (left.status !== "cancelled" && right.status === "cancelled") {
        return -1;
      }

      if (left.paid && !right.paid) {
        return 1;
      }

      if (!left.paid && right.paid) {
        return -1;
      }

      return left.startsAt.localeCompare(right.startsAt);
    });
  }

  const filteredAppointments = useMemo(() => {
    const search = adminSearch.trim().toLowerCase();

    const filtered = appointments.filter((appointment) => {
      const matchesSearch =
        search.length === 0 ||
        appointment.clientName.toLowerCase().includes(search) ||
        appointment.barberName.toLowerCase().includes(search) ||
        appointment.serviceName.toLowerCase().includes(search);

      const matchesStatus =
        appointmentStatusFilter === "all" || appointment.status === appointmentStatusFilter;

      if (user?.role !== "admin") {
        return matchesSearch && matchesStatus;
      }

      const matchesBarber = adminBarberFilter.length === 0 || appointment.barberId === adminBarberFilter;
      const matchesService =
        adminServiceFilter.length === 0 || appointment.serviceId === adminServiceFilter;
      const matchesAdminPeriod =
        adminScheduleScope === "month"
          ? appointment.startsAt.startsWith(adminMonth)
          : true;

      return (
        matchesSearch &&
        matchesBarber &&
        matchesService &&
        matchesStatus &&
        matchesAdminPeriod
      );
    });

    return sortAppointmentsWithCancelledLast(filtered);
  }, [
    appointments,
    user,
    adminSearch,
    adminBarberFilter,
    adminServiceFilter,
    appointmentStatusFilter,
    adminScheduleScope,
    adminMonth
  ]);

  async function loadBootstrap() {
    const data = await api.loadBootstrap();
    const defaultBarberId =
      user?.role === "barber"
        ? data.barbers.find((barber) => barber.email === user.email)?.id ?? data.barbers[0]?.id ?? ""
        : "";

    setBarbers(data.barbers);
    setClients(data.clients);
    setAdmins(data.admins);
    setServices(data.services);
    setBusinessRules(data.businessRules);
    setAppointmentCompletionRule(data.businessRules.appointmentCompletionRule);
    setBarberCancellationHours(String(data.businessRules.barberCancellationHours));
    setClientCancellationHours(String(data.businessRules.clientCancellationHours));
    setClientBookingNoticeHours(String(data.businessRules.clientBookingNoticeHours));
    setSelectedBarberId((current) => {
      const nextBarberId =
        data.barbers.some((barber) => barber.id === current) ? current : defaultBarberId;
      const selectedBarber = data.barbers.find((barber) => barber.id === nextBarberId);
      setBookingBarberSearch(selectedBarber?.name ?? "");
      return nextBarberId;
    });
    setSelectedClientId((current) => {
      const nextClientId =
        data.clients.some((client) => client.id === current)
          ? current
          : user?.role === "admin"
            ? ""
            : data.clients[0]?.id || "";
      const selectedClient = data.clients.find((client) => client.id === nextClientId);
      setBookingClientSearch(selectedClient?.name ?? "");
      return nextClientId;
    });
  }

  async function loadAppointments(activeUser: User) {
    const date =
      activeUser.role === "client"
        ? undefined
        : activeUser.role === "admin" && adminScheduleScope === "month"
          ? undefined
          : selectedDate;
    setAppointments(await api.loadAppointments(date));
  }

  async function loadAvailability(barberId = selectedBarberId, date = selectedDate) {
    const requestId = availabilityRequestRef.current + 1;
    availabilityRequestRef.current = requestId;

    if (!barberId || !date) {
      if (availabilityRequestRef.current === requestId) {
        setAvailability([]);
      }
      return [];
    }

    const data = await api.loadAvailability(barberId, date);
    if (availabilityRequestRef.current === requestId) {
      setAvailability(data);
    }
    return data;
  }

  async function loadFinancial(activeUser: User) {
    if (
      activeUser.role !== "admin" ||
      !financialStartDate ||
      !financialEndDate ||
      adminView !== "financeiro"
    ) {
      setFinancialSummary(null);
      return;
    }

    setFinancialSummary(await api.loadFinancial(financialStartDate, financialEndDate));
  }

  async function loadBookableAvailability(barberId = selectedBarberId, date = selectedDate) {
    const requestId = bookingAvailabilityRequestRef.current + 1;
    bookingAvailabilityRequestRef.current = requestId;

    if (!barberId || !date) {
      if (bookingAvailabilityRequestRef.current === requestId) {
        setBookingAvailability([]);
      }
      return [];
    }

    const data = await api.loadBookableAvailability(barberId, date);
    if (bookingAvailabilityRequestRef.current === requestId) {
      setBookingAvailability(data);
    }
    return data;
  }

  async function loadBookableAvailabilityMonth(barberId = selectedBarberId, month = bookingMonth) {
    const requestId = bookingMonthRequestRef.current + 1;
    bookingMonthRequestRef.current = requestId;

    if (!barberId || !month) {
      if (bookingMonthRequestRef.current === requestId) {
        setBookingMonthAvailability([]);
      }
      return [];
    }

    const data = await api.loadBookableAvailabilityMonth(barberId, month);
    if (bookingMonthRequestRef.current === requestId) {
      setBookingMonthAvailability(data);
    }
    return data;
  }

  async function loadAdminBookingAvailabilityMonth(barberId = selectedBarberId, month = bookingMonth) {
    const requestId = bookingMonthRequestRef.current + 1;
    bookingMonthRequestRef.current = requestId;

    if (!barberId || !month) {
      if (bookingMonthRequestRef.current === requestId) {
        setBookingMonthAvailability([]);
      }
      return [];
    }

    const data = await api.loadAvailabilityMonth(barberId, month);
    if (bookingMonthRequestRef.current === requestId) {
      setBookingMonthAvailability(data);
    }
    return data;
  }

  async function refreshData(successMessage?: string) {
    if (!user) {
      return;
    }

    const tasks: Promise<unknown>[] = [loadBootstrap()];

    if (!(user.role === "admin" && adminView === "agendamento")) {
      tasks.push(loadAppointments(user), loadAvailability(), loadFinancial(user));
    }

    await Promise.all(tasks);
    if (successMessage) {
      setMessage(successMessage);
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedToken || !storedUser) {
      setAuthReady(true);
      return;
    }

    setToken(storedToken);

    async function restoreSession() {
      try {
        const data = await createApiClient(() => storedToken).me();
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      } catch {
        clearSession();
      } finally {
        setAuthReady(true);
      }
    }

    void restoreSession();
  }, []);

  useEffect(() => {
    if (!authReady || !user || !token) {
      return;
    }

    async function syncDashboardData() {
      try {
        const tasks: Promise<unknown>[] = [loadBootstrap()];

        if (!(user.role === "admin" && adminView === "agendamento")) {
          tasks.push(loadAppointments(user), loadAvailability(), loadFinancial(user));
        }

        await Promise.all(tasks);
      } catch (error) {
        setMessage((error as Error).message);
      }
    }

    void syncDashboardData();
  }, [
    authReady,
    user,
    token,
    selectedDate,
    selectedBarberId,
    adminScheduleScope,
    adminMonth,
    adminView,
    financialStartDate,
    financialEndDate
  ]);

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }

    if (!selectedDate.startsWith(adminMonth)) {
      setSelectedDate(`${adminMonth}-01`);
    }
  }, [adminMonth, selectedDate, user]);

  useEffect(() => {
    if (!showBookingModal || user?.role !== "client" || !token) {
      return;
    }

    async function syncBookableMonthAvailability() {
      try {
        await loadBookableAvailabilityMonth();
      } catch (error) {
        setMessage((error as Error).message);
      }
    }

    void syncBookableMonthAvailability();
  }, [showBookingModal, user, token, selectedBarberId, bookingMonth]);

  useEffect(() => {
    if (user?.role !== "admin" || adminView !== "agendamento" || !token) {
      return;
    }

    async function syncAdminBookingMonthAvailability() {
      try {
        await loadAdminBookingAvailabilityMonth();
      } catch (error) {
        setMessage((error as Error).message);
      }
    }

    void syncAdminBookingMonthAvailability();
  }, [user, adminView, token, selectedBarberId, bookingMonth]);

  useEffect(() => {
    if (user?.role !== "admin" || adminView !== "agendamento" || !token) {
      return;
    }

    async function syncAdminBookingAvailability() {
      try {
        await loadAvailability();
      } catch (error) {
        setMessage((error as Error).message);
      }
    }

    void syncAdminBookingAvailability();
  }, [user, adminView, token, selectedBarberId, selectedDate]);

  useEffect(() => {
    if (!showBookingModal || user?.role !== "client" || !token) {
      return;
    }

    async function syncBookableAvailability() {
      try {
        await loadBookableAvailability();
      } catch (error) {
        setMessage((error as Error).message);
      }
    }

    void syncBookableAvailability();
  }, [showBookingModal, user, token, selectedBarberId, selectedDate]);

  useEffect(() => {
    if (barberServices.length > 0 && !barberServices.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(barberServices[0].id);
    }
  }, [barberServices, selectedServiceId]);

  useEffect(() => {
    if (!availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0] ?? "");
    }
  }, [availableTimes, selectedTime]);

  useEffect(() => {
    if (!showBookingModal || user?.role !== "client") {
      return;
    }

    if (!clientAvailableTimes.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [clientAvailableTimes, selectedTime, showBookingModal, user]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    try {
      const data = await api.login(email, password);
      persistSession(data.user, data.token);
      setMessage("");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();

    try {
      const data = await api.register(registerName, registerEmail, registerPassword);
      persistSession(data.user, data.token);
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setMessage("");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleCreateAppointment(event: FormEvent) {
    event.preventDefault();

    if (user?.role === "admin" && !selectedClientId) {
      setMessage("Selecione um cliente para criar o agendamento.");
      return;
    }

    if (!selectedServiceId) {
      setMessage("Selecione um serviço para criar o agendamento.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setMessage("Selecione um dia e um horário disponível para agendar.");
      return;
    }

    try {
      await api.createAppointment({
        clientId: user?.role === "admin" ? selectedClientId : "",
        barberId: selectedBarberId,
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime
      });
      setShowBookingModal(false);
      setBookingAvailability([]);
      await refreshData("Agendamento criado com sucesso.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  function handleBookingBarberChange(barberId: string) {
    setSelectedBarberId(barberId);
    syncBookingBarberSearch(barberId);
    clearBookingAfterBarberChange();
  }

  function handleAdminBookingServiceChange(serviceId: string) {
    setSelectedServiceId(serviceId);
    clearBookingAfterServiceChange();
  }

  function handleBookingBarberSearchChange(value: string) {
    setBookingBarberSearch(value);
    const normalizedValue = value.trim().toLowerCase();
    const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId);

    if (
      selectedBarber &&
      normalizedValue !== selectedBarber.name.toLowerCase() &&
      normalizedValue !== selectedBarber.email.toLowerCase()
    ) {
      setSelectedBarberId("");
      clearBookingAfterBarberChange();
    }
  }

  function handleBookingClientSearchChange(value: string) {
    setBookingClientSearch(value);
    const normalizedValue = value.trim().toLowerCase();
    const selectedClient = clients.find((client) => client.id === selectedClientId);

    if (
      selectedClient &&
      normalizedValue !== selectedClient.name.toLowerCase() &&
      normalizedValue !== selectedClient.email.toLowerCase()
    ) {
      setSelectedClientId("");
      clearBookingAfterBarberChange();
    }

    if (value.trim().length === 0) {
      resetBookingSelection();
    }
  }

  function handleAdminBookingClientChange(clientId: string) {
    setSelectedClientId(clientId);
    syncBookingClientSearch(clientId);
    resetBookingSelection({ keepClient: true });
  }

  function handleBookingMonthChange(month: string) {
    setBookingMonth(month);
    setSelectedDate("");
    setSelectedTime("");
    setBookingAvailability([]);
  }

  function openBookingModal() {
    setBookingMonth(getCurrentMonthInSaoPaulo());
    setSelectedDate("");
    setSelectedTime("");
    setBookingAvailability([]);
    setMessage("");
    setShowBookingModal(true);
  }

  function handleAdminViewChange(view: "home" | "agendamento" | "administrativo" | "financeiro") {
    setAdminView(view);

    if (view === "agendamento") {
      resetBookingSelection();
      setMessage("");
    }
  }

  async function handleToggle(slot: Availability) {
    try {
      await api.toggleAvailability({
        barberId: selectedBarberId,
        date: slot.startsAt.slice(0, 10),
        time: formatTime(slot.startsAt),
        enabled: !slot.enabled
      });
      await refreshData();
      showAvailabilityFeedback("Disponibilidade atualizada.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleToggleAllAvailability(enabled: boolean) {
    const slotsToUpdate = availability.filter((slot) =>
      enabled ? !slot.enabled : slot.enabled && !slot.reserved
    );

    if (slotsToUpdate.length === 0) {
      setMessage(
        enabled
          ? "Todos os horários livres deste dia já estão ativos."
          : "Não há horários livres ativos para desativar neste dia."
      );
      return;
    }

    try {
      await Promise.all(
        slotsToUpdate.map((slot) =>
          api.toggleAvailability({
            barberId: selectedBarberId,
            date: slot.startsAt.slice(0, 10),
            time: formatTime(slot.startsAt),
            enabled
          })
        )
      );
      await refreshData();
      showAvailabilityFeedback(
        enabled
          ? "Todos os horários do dia foram ativados."
          : "Todos os horários livres do dia foram desativados."
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleComplete(appointmentId: string) {
    try {
      await api.completeAppointment(appointmentId);
      await refreshData("Atendimento concluido.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handlePay(appointmentId: string) {
    try {
      await api.payAppointment(appointmentId);
      await refreshData("Pagamento registrado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function openActionModal(appointment: Appointment) {
    try {
      const date = appointment.startsAt.slice(0, 10);
      const modalAvailability = await api.loadAvailability(appointment.barberId, date);

      setActionModal({
        appointment,
        date,
        time: formatTime(appointment.startsAt),
        serviceId: appointment.serviceId,
        availability: modalAvailability
      });
      setMenuAppointmentId(null);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function updateModalDate(date: string) {
    if (!actionModal) {
      return;
    }

    try {
      const nextAvailability = await api.loadAvailability(actionModal.appointment.barberId, date);
      const nextTimes = nextAvailability
        .filter(
          (slot) =>
            (slot.available || formatTime(slot.startsAt) === formatTime(actionModal.appointment.startsAt)) &&
            (!slot.reserved || formatTime(slot.startsAt) === formatTime(actionModal.appointment.startsAt))
        )
        .map((slot) => formatTime(slot.startsAt));

      setActionModal((current) =>
        current
          ? {
              ...current,
              date,
              availability: nextAvailability,
              time: nextTimes[0] ?? ""
            }
          : current
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleSaveAppointmentChanges() {
    if (!actionModal) {
      return;
    }

    if (!actionModal.time) {
      setMessage("Selecione um horário disponível para reagendar.");
      return;
    }

    try {
      const nextDate =
        actionModal.date === actionModal.appointment.startsAt.slice(0, 10) ? undefined : actionModal.date;
      const nextTime =
        actionModal.time === formatTime(actionModal.appointment.startsAt) ? undefined : actionModal.time;
      const nextServiceId =
        actionModal.serviceId === actionModal.appointment.serviceId ? undefined : actionModal.serviceId;

      await api.updateAppointment(actionModal.appointment.id, {
        serviceId: nextServiceId,
        date: nextDate,
        time: nextTime
      });
      setActionModal(null);
      await refreshData("Agendamento atualizado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleCancelAppointment(appointmentId: string) {
    try {
      await api.cancelAppointment(appointmentId);
      setActionModal(null);
      await refreshData("Agendamento cancelado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeleteAppointment(appointmentId: string) {
    try {
      await api.deleteAppointment(appointmentId);
      setActionModal(null);
      await refreshData("Agendamento excluido.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleCreateService(event: FormEvent) {
    event.preventDefault();

    try {
      const payload = {
        name: serviceName,
        priceInCents: Number(servicePrice.replace(/\D/g, "") || "0"),
        assignToAllBarbers: serviceAssignmentMode === "all",
        barberIds: serviceAssignmentMode === "selected" ? serviceBarberIds : undefined
      };

      if (editingServiceId) {
        await api.updateService(editingServiceId, payload);
        resetServiceForm();
        await refreshData("Serviço atualizado.");
        return;
      }

      await api.createService(payload);
      resetServiceForm();
      await refreshData("Serviço cadastrado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  function handleServicePriceChange(value: string) {
    setServicePrice(value.replace(/\D/g, ""));
  }

  async function handleToggleServiceActive(serviceId: string, active: boolean) {
    try {
      await api.updateService(serviceId, { active });
      await refreshData(active ? "Serviço reativado." : "Serviço desativado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeleteService(serviceId: string) {
    try {
      await api.deleteService(serviceId);
      if (editingServiceId === serviceId) {
        resetServiceForm();
      }
      await refreshData("Serviço excluído.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  function handleEditService(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    if (!service) {
      return;
    }

    const assignedBarberIds = barbers
      .filter((barber) => barber.serviceIds.includes(serviceId))
      .map((barber) => barber.id);

    setEditingServiceId(serviceId);
    setServiceName(service.name);
    setServicePrice(String(service.priceInCents));
    setServiceAssignmentMode(
      assignedBarberIds.length > 0 && assignedBarberIds.length === barbers.length ? "all" : "selected"
    );
    setServiceBarberIds(assignedBarberIds);
  }

  async function handleCreateClient(event: FormEvent) {
    event.preventDefault();

    try {
      await api.createClient({
        name: clientName,
        email: clientEmail,
        password: clientPassword
      });
      setClientName("");
      setClientEmail("");
      setClientPassword("");
      await refreshData("Cliente cadastrado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeleteClient(clientId: string) {
    try {
      await api.deleteClient(clientId);
      await refreshData("Cliente excluído.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleCreateBarber(event: FormEvent) {
    event.preventDefault();

    try {
      await api.createBarber({
        name: barberName,
        email: barberEmail,
        password: barberPassword,
        serviceIds: barberServiceIds
      });
      setBarberName("");
      setBarberEmail("");
      setBarberPassword("");
      setBarberServiceIds([]);
      await refreshData("Barbeiro cadastrado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeleteBarber(barberId: string) {
    try {
      await api.deleteBarber(barberId);
      await refreshData("Barbeiro excluído.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleCreateAdmin(event: FormEvent) {
    event.preventDefault();

    try {
      await api.createAdmin({
        name: adminName,
        email: adminEmail,
        password: adminPassword
      });
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      await refreshData("Administrador cadastrado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeleteAdmin(adminId: string) {
    try {
      await api.deleteAdmin(adminId);
      await refreshData("Administrador excluído.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleSaveBusinessRules(event: FormEvent) {
    event.preventDefault();

    try {
      const payload: BusinessRules = {
        appointmentCompletionRule,
        barberCancellationHours: Number(barberCancellationHours || "0"),
        clientCancellationHours: Number(clientCancellationHours || "0"),
        clientBookingNoticeHours: Number(clientBookingNoticeHours || "0")
      };

      await api.updateBusinessRules(payload);
      await refreshData("Regras da barbearia atualizadas.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return {
    authReady,
    authScreen,
    setAuthScreen,
    user,
    setUser,
    token,
    setToken,
    clearSession,
    email,
    setEmail,
    password,
    setPassword,
    registerName,
    setRegisterName,
    registerEmail,
    setRegisterEmail,
    registerPassword,
    setRegisterPassword,
    admins,
    barbers,
    clients,
    services,
    businessRules,
    activeServices,
    availableBarbers,
    appointments,
    filteredAppointments,
    availability,
    availabilityFeedback,
    bookingAvailability,
    bookingMonthAvailability,
    message,
    setMessage,
    selectedBarberId,
    setSelectedBarberId,
    handleBookingBarberChange,
    handleAdminBookingServiceChange,
    selectedClientId,
    setSelectedClientId,
    bookingClientSearch,
    setBookingClientSearch,
    filteredBookingClients,
    handleBookingClientSearchChange,
    handleAdminBookingClientChange,
    bookingBarberSearch,
    setBookingBarberSearch,
    filteredBookingBarbers,
    filteredBookingBarbersByService,
    handleBookingBarberSearchChange,
    selectedServiceId,
    setSelectedServiceId,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    bookingMonth,
    setBookingMonth,
    handleBookingMonthChange,
    adminScheduleScope,
    setAdminScheduleScope,
    adminMonth,
    setAdminMonth,
    financialStartDate,
    setFinancialStartDate,
    financialEndDate,
    setFinancialEndDate,
    financialSummary,
    menuAppointmentId,
    setMenuAppointmentId,
    actionModal,
    setActionModal,
    showBookingModal,
    setShowBookingModal,
    openBookingModal,
    adminView,
    setAdminView,
    handleAdminViewChange,
    adminManagementView,
    setAdminManagementView,
    barberView,
    setBarberView,
    adminSearch,
    setAdminSearch,
    adminBarberFilter,
    setAdminBarberFilter,
    adminServiceFilter,
    setAdminServiceFilter,
    appointmentStatusFilter,
    setAppointmentStatusFilter,
    serviceName,
    setServiceName,
    servicePrice: formatCurrencyInput(servicePrice),
    setServicePrice,
    handleServicePriceChange,
    editingServiceId,
    setEditingServiceId,
    serviceAssignmentMode,
    setServiceAssignmentMode,
    serviceBarberIds,
    setServiceBarberIds,
    resetServiceForm,
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    clientPassword,
    setClientPassword,
    barberName,
    setBarberName,
    barberEmail,
    setBarberEmail,
    barberPassword,
    setBarberPassword,
    adminName,
    setAdminName,
    adminEmail,
    setAdminEmail,
    adminPassword,
    setAdminPassword,
    barberServiceIds,
    setBarberServiceIds,
    appointmentCompletionRule,
    setAppointmentCompletionRule,
    barberCancellationHours,
    setBarberCancellationHours,
    clientCancellationHours,
    setClientCancellationHours,
    clientBookingNoticeHours,
    setClientBookingNoticeHours,
    barberServices,
    availableTimes,
    clientAvailableTimes,
    modalTimes,
    handleLogin,
    handleRegister,
    handleCreateAppointment,
    handleToggle,
    handleEnableAllAvailability: () => handleToggleAllAvailability(true),
    handleDisableAllAvailability: () => handleToggleAllAvailability(false),
    handleComplete,
    handlePay,
    openActionModal,
    updateModalDate,
    handleSaveAppointmentChanges,
    handleCancelAppointment,
    handleDeleteAppointment,
    handleCreateService,
    handleEditService,
    handleDeleteService,
    handleToggleServiceActive,
    handleCreateClient,
    handleDeleteClient,
    handleCreateBarber,
    handleDeleteBarber,
    handleCreateAdmin,
    handleDeleteAdmin,
    handleSaveBusinessRules
  };
}
