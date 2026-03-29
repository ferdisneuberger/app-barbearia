import { useRef, useState } from "react";
import type { Appointment, Barber, BusinessRules, Role, Service } from "../../app/types";
import { formatDateTime } from "../../app/utils";

type Props = {
  role: Role;
  appointments: Appointment[];
  selectedDate?: string;
  adminScheduleScope?: "day" | "month";
  adminMonth?: string;
  search?: string;
  barberFilter?: string;
  serviceFilter?: string;
  statusFilter: string;
  barbers?: Barber[];
  services?: Service[];
  onDateChange?: (value: string) => void;
  onAdminScheduleScopeChange?: (value: "day" | "month") => void;
  onAdminMonthChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onBarberFilterChange?: (value: string) => void;
  onServiceFilterChange?: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  businessRules: BusinessRules;
  menuAppointmentId: string | null;
  onMenuToggle: (appointmentId: string) => void;
  onComplete: (appointmentId: string) => void;
  onPay: (appointmentId: string) => void;
  onManage: (appointment: Appointment) => void;
};

function getStatusLabel(status: string) {
  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "completed") {
    return "Concluído";
  }

  if (status === "cancelled") {
    return "Cancelado";
  }

  return status;
}

function getStatusClassName(status: string) {
  if (status === "confirmed") {
    return "badge badge-confirmed";
  }

  if (status === "completed") {
    return "badge badge-completed";
  }

  if (status === "cancelled") {
    return "badge badge-cancelled";
  }

  return "badge";
}

function renderDetails(role: Role, appointment: Appointment) {
  if (role === "barber") {
    return `${appointment.clientName} • ${appointment.serviceName}`;
  }

  if (role === "admin") {
    return `${appointment.clientName} • ${appointment.barberName} • ${appointment.serviceName}`;
  }

  return `${appointment.barberName} • ${appointment.serviceName}`;
}

function canCompleteAppointment(appointment: Appointment, businessRules: BusinessRules) {
  if (businessRules.appointmentCompletionRule === "anytime") {
    return true;
  }

  return new Date() >= new Date(appointment.startsAt);
}

function getCompleteTooltipMessage(businessRules: BusinessRules) {
  if (businessRules.appointmentCompletionRule === "anytime") {
    return "Atendimento pode ser concluído a qualquer momento.";
  }

  return "Só é possível concluir após iniciar o atendimento.";
}

export function AppointmentsPanel(props: Props) {
  const [blockedTooltipAppointmentId, setBlockedTooltipAppointmentId] = useState<string | null>(null);
  const [showCancelledAppointments, setShowCancelledAppointments] = useState(false);
  const blockedTooltipTimeoutRef = useRef<number | null>(null);
  const visibleAppointments =
    props.statusFilter === "all"
      ? props.appointments.filter((appointment) => appointment.status !== "cancelled")
      : props.appointments;
  const cancelledAppointments =
    props.statusFilter === "all"
      ? props.appointments.filter((appointment) => appointment.status === "cancelled")
      : [];
  const monthSummary = props.role === "admin" && props.adminScheduleScope === "month"
    ? Array.from(
        props.appointments.reduce((map, appointment) => {
          const date = appointment.startsAt.slice(0, 10);
          const current = map.get(date) ?? 0;
          map.set(date, current + 1);
          return map;
        }, new Map<string, number>())
      )
        .map(([date, count]) => ({ date, count }))
        .sort((left, right) => left.date.localeCompare(right.date))
    : [];
  const monthDayAppointments =
    props.role === "admin" && props.adminScheduleScope === "month" && props.selectedDate
      ? visibleAppointments.filter((appointment) => appointment.startsAt.startsWith(props.selectedDate))
      : visibleAppointments;

  function hideBlockedTooltip() {
    setBlockedTooltipAppointmentId(null);

    if (blockedTooltipTimeoutRef.current !== null) {
      globalThis.clearTimeout(blockedTooltipTimeoutRef.current);
      blockedTooltipTimeoutRef.current = null;
    }
  }

  function showBlockedTooltip(appointmentId: string) {
    hideBlockedTooltip();
    setBlockedTooltipAppointmentId(appointmentId);
    blockedTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setBlockedTooltipAppointmentId(null);
      blockedTooltipTimeoutRef.current = null;
    }, 2200);
  }

  function renderAppointmentRow(appointment: Appointment) {
    return (
      <div className={appointment.status === "cancelled" ? "row cancelled-row" : "row"} key={appointment.id}>
        {(props.role === "barber" || props.role === "admin" || props.role === "client") &&
        appointment.status === "confirmed" ? (
          <div className="row-menu-anchor">
            <div className="menu-wrap">
              <button
                className="ghost menu-trigger"
                onClick={() => props.onMenuToggle(appointment.id)}
              >
                ⋮
              </button>
              {props.menuAppointmentId === appointment.id ? (
                <div className="menu">
                  <button className="menu-item" onClick={() => props.onManage(appointment)}>
                    {props.role === "client" ? "Cancelar agendamento" : "Gerenciar agendamento"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="row-main">
          <strong>{formatDateTime(appointment.startsAt)}</strong>
          <p>{renderDetails(props.role, appointment)}</p>
          <div className="badge-row">
            <span className={getStatusClassName(appointment.status)}>
              {getStatusLabel(appointment.status)}
            </span>
            {appointment.paid ? <span className="badge badge-paid">Pago</span> : null}
            {appointment.rescheduledAt ? <span className="badge badge-rescheduled">Alterado</span> : null}
          </div>
        </div>
        <div className="row-actions">
          {(props.role === "barber" || props.role === "admin") &&
          appointment.status === "confirmed" ? (() => {
            const canComplete = canCompleteAppointment(appointment, props.businessRules);
            const blockedMessage = getCompleteTooltipMessage(props.businessRules);

            return (
              <div
                className="action-with-tooltip"
                onMouseLeave={hideBlockedTooltip}
              >
                {!canComplete && blockedTooltipAppointmentId === appointment.id ? (
                  <div className="action-tooltip" role="status" aria-live="polite">
                    {blockedMessage}
                  </div>
                ) : null}
                <button
                  className={canComplete ? "ghost" : "ghost is-disabled"}
                  aria-disabled={!canComplete}
                  title={canComplete ? "Concluir atendimento" : blockedMessage}
                  onBlur={hideBlockedTooltip}
                  onClick={() =>
                    canComplete
                      ? props.onComplete(appointment.id)
                      : showBlockedTooltip(appointment.id)
                  }
                >
                  Concluir
                </button>
              </div>
            );
          })() : null}
          {(props.role === "barber" || props.role === "admin") &&
          appointment.status === "completed" &&
          !appointment.paid ? (
            <button className="ghost" onClick={() => props.onPay(appointment.id)}>
              Marcar pago
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <article className="panel">
      <div className="panel-head">
        <h2>Agenda</h2>
        <div className="agenda-filters">
          <label className="compact-field">
            <span>Busca</span>
            <input
              value={props.search ?? ""}
              onChange={(event) => props.onSearchChange?.(event.target.value)}
              placeholder="Cliente, barbeiro ou serviço"
            />
          </label>
          {props.role === "barber" || props.role === "admin" ? (
            <label className="compact-field">
              <span>Data</span>
              <input
                type="date"
                value={props.selectedDate ?? ""}
                onChange={(event) => props.onDateChange?.(event.target.value)}
              />
            </label>
          ) : null}
          {props.role === "admin" ? (
            <>
              <label className="compact-field">
                <span>Visão</span>
                <select
                  value={props.adminScheduleScope ?? "day"}
                  onChange={(event) =>
                    props.onAdminScheduleScopeChange?.(event.target.value as "day" | "month")
                  }
                >
                  <option value="day">Dia</option>
                  <option value="month">Mês</option>
                </select>
              </label>
              {props.adminScheduleScope === "month" ? (
                <label className="compact-field">
                  <span>Mês</span>
                  <input
                    type="month"
                    value={props.adminMonth ?? ""}
                    onChange={(event) => props.onAdminMonthChange?.(event.target.value)}
                  />
                </label>
              ) : null}
              <label className="compact-field">
                <span>Barbeiro</span>
                <select
                  value={props.barberFilter ?? ""}
                  onChange={(event) => props.onBarberFilterChange?.(event.target.value)}
                >
                  <option value="">Todos</option>
                  {props.barbers?.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="compact-field">
                <span>Serviço</span>
                <select
                  value={props.serviceFilter ?? ""}
                  onChange={(event) => props.onServiceFilterChange?.(event.target.value)}
                >
                  <option value="">Todos</option>
                  {props.services?.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          <label className="compact-field">
            <span>Status</span>
            <select
              value={props.statusFilter}
              onChange={(event) => props.onStatusFilterChange(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Concluídos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </label>
        </div>
      </div>
      {props.role === "admin" && props.adminScheduleScope === "month" ? (
        <>
          <div className="month-summary">
            {monthSummary.map((item) => (
              <button
                key={item.date}
                type="button"
                className={props.selectedDate === item.date ? "month-day-card is-selected" : "month-day-card"}
                onClick={() => props.onDateChange?.(item.date)}
              >
                <strong>{item.date.slice(8, 10)}</strong>
                <small>{item.count} agendamentos</small>
              </button>
            ))}
          </div>
          <div className="list">
            {monthDayAppointments.map(renderAppointmentRow)}
          </div>
        </>
      ) : (
        <div className="list">
          {visibleAppointments.map(renderAppointmentRow)}
        </div>
      )}
      {cancelledAppointments.length > 0 ? (
        <div className="cancelled-group">
          <button
            type="button"
            className="ghost cancelled-toggle"
            onClick={() => setShowCancelledAppointments((current) => !current)}
          >
            {showCancelledAppointments ? "Ocultar" : "Mostrar"} cancelados ({cancelledAppointments.length})
          </button>
          {showCancelledAppointments ? (
            <div className="list cancelled-list">
              {cancelledAppointments.map(renderAppointmentRow)}
            </div>
          ) : null}
        </div>
      ) : null}
      {monthDayAppointments.length === 0 && cancelledAppointments.length === 0 ? (
        <div className="list">
          <p className="muted">Nenhum agendamento encontrado.</p>
        </div>
      ) : null}
    </article>
  );
}
