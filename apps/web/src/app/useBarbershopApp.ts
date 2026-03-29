import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createApiClient } from "./api";
import type {
  ActionModalState,
  Appointment,
  Availability,
  Barber,
  BookingDayAvailability,
  Client,
  FinancialSummary,
  Service,
  User
} from "./types";
import { formatTime, getCurrentMonthInSaoPaulo, getTodayInSaoPaulo } from "./utils";

const TOKEN_STORAGE_KEY = "barbearia.token";
const USER_STORAGE_KEY = "barbearia.user";

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
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [availabilityFeedback, setAvailabilityFeedback] = useState("");
  const [bookingAvailability, setBookingAvailability] = useState<Availability[]>([]);
  const [bookingMonthAvailability, setBookingMonthAvailability] = useState<BookingDayAvailability[]>([]);
  const [message, setMessage] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => getTodayInSaoPaulo());
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingMonth, setBookingMonth] = useState(() => getCurrentMonthInSaoPaulo());
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [menuAppointmentId, setMenuAppointmentId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [adminView, setAdminView] = useState<"agenda" | "administrativo" | "financeiro">("agenda");
  const [barberView, setBarberView] = useState<"agenda" | "disponibilidade">("agenda");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminBarberFilter, setAdminBarberFilter] = useState("");
  const [adminServiceFilter, setAdminServiceFilter] = useState("");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("all");

  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("0");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [barberName, setBarberName] = useState("");
  const [barberEmail, setBarberEmail] = useState("");
  const [barberPassword, setBarberPassword] = useState("");
  const [barberServiceIds, setBarberServiceIds] = useState<string[]>([]);
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

      return left.startsAt.localeCompare(right.startsAt);
    });
  }

  const filteredAppointments = useMemo(() => {
    if (user?.role !== "admin") {
      const statusFiltered =
        appointmentStatusFilter === "all"
          ? appointments
          : appointments.filter((appointment) => appointment.status === appointmentStatusFilter);

      return sortAppointmentsWithCancelledLast(statusFiltered);
    }

    const search = adminSearch.trim().toLowerCase();

    const filtered = appointments.filter((appointment) => {
      const matchesSearch =
        search.length === 0 ||
        appointment.clientName.toLowerCase().includes(search) ||
        appointment.barberName.toLowerCase().includes(search) ||
        appointment.serviceName.toLowerCase().includes(search);

      const matchesBarber = adminBarberFilter.length === 0 || appointment.barberId === adminBarberFilter;
      const matchesService =
        adminServiceFilter.length === 0 || appointment.serviceId === adminServiceFilter;
      const matchesStatus =
        appointmentStatusFilter === "all" || appointment.status === appointmentStatusFilter;

      return matchesSearch && matchesBarber && matchesService && matchesStatus;
    });

    return sortAppointmentsWithCancelledLast(filtered);
  }, [appointments, user, adminSearch, adminBarberFilter, adminServiceFilter, appointmentStatusFilter]);

  async function loadBootstrap() {
    const data = await api.loadBootstrap();
    const defaultBarberId =
      user?.role === "barber"
        ? data.barbers.find((barber) => barber.email === user.email)?.id ?? data.barbers[0]?.id ?? ""
        : data.barbers[0]?.id ?? "";

    setBarbers(data.barbers);
    setClients(data.clients);
    setServices(data.services);
    setSelectedBarberId((current) =>
      data.barbers.some((barber) => barber.id === current) ? current : defaultBarberId
    );
    setSelectedClientId((current) =>
      data.clients.some((client) => client.id === current) ? current : data.clients[0]?.id || ""
    );
  }

  async function loadAppointments(activeUser: User) {
    const date = activeUser.role === "client" ? undefined : selectedDate;
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
    if (activeUser.role !== "admin") {
      setFinancialSummary(null);
      return;
    }

    setFinancialSummary(await api.loadFinancial(selectedDate));
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

  async function refreshData(successMessage?: string) {
    if (!user) {
      return;
    }

    await Promise.all([loadBootstrap(), loadAppointments(user), loadAvailability(), loadFinancial(user)]);
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
        await Promise.all([
          loadBootstrap(),
          loadAppointments(user),
          loadAvailability(),
          loadFinancial(user)
        ]);
      } catch (error) {
        setMessage((error as Error).message);
      }
    }

    void syncDashboardData();
  }, [authReady, user, token, selectedDate, selectedBarberId]);

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

    if (!selectedDate || !selectedTime) {
      setMessage("Selecione um dia e um horario disponivel para agendar.");
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
    setSelectedDate("");
    setSelectedTime("");
    setBookingAvailability([]);
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
          ? "Todos os horarios livres deste dia ja estao ativos."
          : "Nao ha horarios livres ativos para desativar neste dia."
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
          ? "Todos os horarios do dia foram ativados."
          : "Todos os horarios livres do dia foram desativados."
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
      setMessage("Selecione um horario disponivel para reagendar.");
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
      await api.createService({
        name: serviceName,
        priceInCents: Math.round(Number(servicePrice) * 100)
      });
      setServiceName("");
      setServicePrice("0");
      await refreshData("Servico cadastrado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeactivateService(serviceId: string) {
    try {
      await api.updateService(serviceId, { active: false });
      await refreshData("Servico desativado.");
    } catch (error) {
      setMessage((error as Error).message);
    }
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
    barbers,
    clients,
    services,
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
    selectedClientId,
    setSelectedClientId,
    selectedServiceId,
    setSelectedServiceId,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    bookingMonth,
    setBookingMonth,
    handleBookingMonthChange,
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
    servicePrice,
    setServicePrice,
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
    barberServiceIds,
    setBarberServiceIds,
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
    handleDeactivateService,
    handleCreateClient,
    handleCreateBarber
  };
}
