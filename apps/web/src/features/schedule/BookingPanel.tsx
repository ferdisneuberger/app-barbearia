import { useState } from "react";
import type { FormEventHandler } from "react";
import type {
  Barber,
  BookingDayAvailability,
  Client,
  Role,
  Service
} from "../../app/types";

type Props = {
  role: Role;
  clients: Client[];
  filteredClients?: Client[];
  barbers: Barber[];
  filteredBarbers?: Barber[];
  services: Service[];
  selectedDate: string;
  selectedClientId: string;
  clientSearch?: string;
  selectedBarberId: string;
  barberSearch?: string;
  selectedServiceId: string;
  selectedTime: string;
  availableTimes: string[];
  bookingMonth?: string;
  monthAvailability?: BookingDayAvailability[];
  message: string;
  onBookingMonthChange?: (value: string) => void;
  onDateChange: (value: string) => void;
  onClientChange: (value: string) => void;
  onClientSearchChange?: (value: string) => void;
  onBarberChange: (value: string) => void;
  onBarberSearchChange?: (value: string) => void;
  onServiceChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onSubmit: FormEventHandler;
};

function buildMonthDays(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekDay = (firstDay.getDay() + 6) % 7;

  return {
    daysInMonth,
    startWeekDay
  };
}

function formatMonthLabel(month: string) {
  const [yearText, monthText] = month.split("-");
  return new Date(Number(yearText), Number(monthText) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const monthOptions = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" }
];

function getFallbackMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit"
  }).format(new Date());
}

export function BookingPanel(props: Props) {
  const visibleClients = props.filteredClients ?? props.clients;
  const visibleBarbers = props.filteredBarbers ?? props.barbers;
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const [isBarberPickerOpen, setIsBarberPickerOpen] = useState(false);

  if (props.role === "barber") {
    return (
      <article className="panel">
        <h2>Agendamento</h2>
        <form className="stack" onSubmit={props.onSubmit}>
          <label>
            Data
            <input
              type="date"
              value={props.selectedDate}
              onChange={(event) => props.onDateChange(event.target.value)}
            />
          </label>

          {props.role === "admin" ? (
            <label>
              Cliente
              <select
                value={props.selectedClientId}
                onChange={(event) => props.onClientChange(event.target.value)}
              >
                {props.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="stack client-picker">
            <label>
              Barbeiro
              <input
                type="search"
                value={props.barberSearch ?? ""}
                onFocus={() => setIsBarberPickerOpen(true)}
                onBlur={() => {
                  globalThis.setTimeout(() => {
                    setIsBarberPickerOpen(false);
                  }, 120);
                }}
                onChange={(event) => {
                  setIsBarberPickerOpen(true);
                  props.onBarberSearchChange?.(event.target.value);
                }}
                placeholder="Digite para buscar barbeiro"
              />
            </label>
            {isBarberPickerOpen ? (
              <div className="client-picker-list" role="listbox" aria-label="Barbeiros encontrados">
                {visibleBarbers.length === 0 ? (
                  <p className="muted">Nenhum barbeiro encontrado.</p>
                ) : (
                  visibleBarbers.map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      className={
                        props.selectedBarberId === barber.id
                          ? "client-picker-item is-selected"
                          : "client-picker-item"
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        props.onBarberChange(barber.id);
                        setIsBarberPickerOpen(false);
                      }}
                    >
                      <strong>{barber.name}</strong>
                      <small>{barber.email}</small>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <label>
            Serviço
            <select
              value={props.selectedServiceId}
              onChange={(event) => props.onServiceChange(event.target.value)}
            >
              {props.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Horário disponível
            <select
              value={props.selectedTime}
              onChange={(event) => props.onTimeChange(event.target.value)}
              disabled={props.availableTimes.length === 0}
            >
              {props.availableTimes.length === 0 ? (
                <option value="">Nenhum horário disponível</option>
              ) : (
                props.availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))
              )}
            </select>
          </label>

          <button type="submit" disabled={props.role === "barber" || !props.selectedTime}>
            Criar agendamento
          </button>
        </form>

        {props.message ? <p className="message">{props.message}</p> : null}
      </article>
    );
  }

  const bookingMonth =
    props.bookingMonth && /^\d{4}-\d{2}$/.test(props.bookingMonth)
      ? props.bookingMonth
      : getFallbackMonth();
  const monthAvailability = props.monthAvailability ?? [];
  const availabilityMap = new Map(monthAvailability.map((item) => [item.date, item.availableCount]));
  const { daysInMonth, startWeekDay } = buildMonthDays(bookingMonth);
  const monthLabel = formatMonthLabel(bookingMonth);
  const [selectedYear, selectedMonth] = bookingMonth.split("-");
  const yearOptions = Array.from({ length: 5 }).map((_, index) => String(Number(selectedYear) - 1 + index));

  return (
    <article className="panel booking-panel">
      <h2>Novo agendamento</h2>
      <form className="stack" onSubmit={props.onSubmit}>
        {props.role === "admin" ? (
          <div className="stack client-picker">
            <label>
              Cliente
              <input
                type="search"
                value={props.clientSearch ?? ""}
                onFocus={() => setIsClientPickerOpen(true)}
                onBlur={() => {
                  globalThis.setTimeout(() => {
                    setIsClientPickerOpen(false);
                  }, 120);
                }}
                onChange={(event) => props.onClientSearchChange?.(event.target.value)}
                placeholder="Digite para buscar cliente"
              />
            </label>
            {isClientPickerOpen ? (
              <div className="client-picker-list" role="listbox" aria-label="Clientes encontrados">
                {visibleClients.length === 0 ? (
                  <p className="muted">Nenhum cliente encontrado.</p>
                ) : (
                  visibleClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className={
                        props.selectedClientId === client.id
                          ? "client-picker-item is-selected"
                          : "client-picker-item"
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        props.onClientChange(client.id);
                        setIsClientPickerOpen(false);
                      }}
                    >
                      <strong>{client.name}</strong>
                      <small>{client.email}</small>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {props.role === "admin" && props.selectedClientId ? (
          <label>
            Serviço
            <select
              value={props.selectedServiceId}
              onChange={(event) => props.onServiceChange(event.target.value)}
            >
              <option value="">Selecione um serviço</option>
              {props.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {props.role !== "admin" ? (
          <label>
            Serviço
            <select
              value={props.selectedServiceId}
              onChange={(event) => props.onServiceChange(event.target.value)}
            >
              {props.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {props.role !== "admin" || props.selectedServiceId ? (
          <div className="stack client-picker">
            <label>
              Barbeiro
            <input
              type="search"
              value={props.barberSearch ?? ""}
              onFocus={() => setIsBarberPickerOpen(true)}
              onBlur={() => {
                  globalThis.setTimeout(() => {
                  setIsBarberPickerOpen(false);
                }, 120);
              }}
              onChange={(event) => {
                setIsBarberPickerOpen(true);
                props.onBarberSearchChange?.(event.target.value);
              }}
              placeholder="Digite para buscar barbeiro"
            />
          </label>
            {isBarberPickerOpen ? (
              <div className="client-picker-list" role="listbox" aria-label="Barbeiros encontrados">
                {visibleBarbers.length === 0 ? (
                  <p className="muted">Nenhum barbeiro encontrado.</p>
                ) : (
                  visibleBarbers.map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      className={
                        props.selectedBarberId === barber.id
                          ? "client-picker-item is-selected"
                          : "client-picker-item"
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        props.onBarberChange(barber.id);
                        setIsBarberPickerOpen(false);
                      }}
                    >
                      <strong>{barber.name}</strong>
                      <small>{barber.email}</small>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {props.selectedBarberId ? (
          <section className="booking-calendar">
            <div className="calendar-head">
              <div className="calendar-toolbar">
                <h3>{monthLabel}</h3>
                <div className="calendar-toolbar-fields">
                  <label className="compact-field">
                    <span>Mês</span>
                    <select
                      value={selectedMonth}
                      onChange={(event) =>
                        props.onBookingMonthChange?.(`${selectedYear}-${event.target.value}`)
                      }
                    >
                      {monthOptions.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="compact-field">
                    <span>Ano</span>
                    <select
                      value={selectedYear}
                      onChange={(event) =>
                        props.onBookingMonthChange?.(`${event.target.value}-${selectedMonth}`)
                      }
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <p className="muted">Dias com vagas ficam marcados. Sem vagas, ficam em vermelho.</p>
            </div>
            <div className="calendar-grid">
              {weekDays.map((day) => (
                <span key={day} className="calendar-weekday">
                  {day}
                </span>
              ))}
              {Array.from({ length: startWeekDay }).map((_, index) => (
                <span key={`empty-${index}`} className="calendar-empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = `${bookingMonth}-${String(day).padStart(2, "0")}`;
                const availableCount = availabilityMap.get(date) ?? 0;
                const isSelected = props.selectedDate === date;
                const className = availableCount > 0
                  ? `calendar-day${isSelected ? " is-selected" : ""} has-availability`
                  : `calendar-day${isSelected ? " is-selected" : ""} no-availability`;

                return (
                  <button
                    key={date}
                    type="button"
                    className={className}
                    onClick={() => props.onDateChange(date)}
                  >
                    <span>{day}</span>
                    <small>{availableCount > 0 ? `${availableCount} vagas` : "Sem vagas"}</small>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {props.selectedDate ? (
          <>
            <div className="stack">
              <p className="muted">Horários disponíveis para o dia selecionado</p>
              <div className="time-grid">
                {props.availableTimes.length === 0 ? (
                  <p className="muted">Nenhum horário disponível neste dia.</p>
                ) : (
                  props.availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={props.selectedTime === time ? "time-chip active-time-chip" : "time-chip"}
                      onClick={() => props.onTimeChange(time)}
                    >
                      {time}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}

        <button type="submit" disabled={!props.selectedDate || !props.selectedTime}>
          {props.role === "admin" ? "Criar agendamento" : "Efetuar agendamento"}
        </button>
      </form>

      {props.message ? <p className="message">{props.message}</p> : null}
    </article>
  );
}
