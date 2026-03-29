import { useRef, useState } from "react";
import type { Appointment, Barber, Role, Service } from "../../app/types";
import { formatDateTime } from "../../app/utils";

type Props = {
  role: Role;
  appointments: Appointment[];
  selectedDate?: string;
  search?: string;
  barberFilter?: string;
  serviceFilter?: string;
  statusFilter: string;
  barbers?: Barber[];
  services?: Service[];
  onDateChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onBarberFilterChange?: (value: string) => void;
  onServiceFilterChange?: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
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
    return "Concluido";
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

function canCompleteAppointment(appointment: Appointment) {
  return new Date() >= new Date(appointment.startsAt);
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
            const canComplete = canCompleteAppointment(appointment);

            return (
              <div
                className="action-with-tooltip"
                onMouseLeave={hideBlockedTooltip}
              >
                {!canComplete && blockedTooltipAppointmentId === appointment.id ? (
                  <div className="action-tooltip" role="status" aria-live="polite">
                    So e possivel concluir apos iniciar o atendimento.
                  </div>
                ) : null}
                <button
                  className={canComplete ? "ghost" : "ghost is-disabled"}
                  aria-disabled={!canComplete}
                  title={
                    canComplete
                      ? "Concluir atendimento"
                      : "So e possivel concluir apos iniciar o atendimento"
                  }
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
          {props.role === "barber" ? (
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
                <span>Busca</span>
                <input
                  value={props.search ?? ""}
                  onChange={(event) => props.onSearchChange?.(event.target.value)}
                  placeholder="Cliente, barbeiro ou servico"
                />
              </label>
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
                <span>Servico</span>
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
              <option value="completed">Concluidos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </label>
        </div>
      </div>
      <div className="list">
        {visibleAppointments.map(renderAppointmentRow)}
      </div>
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
      {visibleAppointments.length === 0 && cancelledAppointments.length === 0 ? (
        <div className="list">
          <p className="muted">Nenhum agendamento encontrado.</p>
        </div>
      ) : null}
    </article>
  );
}
