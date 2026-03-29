import type { Availability, Role } from "../../app/types";
import { formatTime } from "../../app/utils";

type Props = {
  role: Role;
  selectedDate: string;
  availability: Availability[];
  feedbackMessage: string;
  onDateChange: (value: string) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onToggle: (slot: Availability) => void;
};

export function AvailabilityPanel(props: Props) {
  const enabledCount = props.availability.filter((slot) => slot.enabled).length;
  const reservedCount = props.availability.filter((slot) => slot.reserved).length;

  return (
    <article className="panel">
      <div className="panel-head">
        <h2>Disponibilidade</h2>
        <div className="agenda-filters">
          <label className="compact-field">
            <span>Data</span>
            <input
              type="date"
              value={props.selectedDate}
              onChange={(event) => props.onDateChange(event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="availability-toolbar">
        <p className="muted">
          {enabledCount} ativos • {reservedCount} reservados
        </p>
        <div className="availability-bulk-actions">
          <button type="button" className="ghost" onClick={props.onEnableAll}>
            Ativar todos
          </button>
          <button type="button" className="ghost" onClick={props.onDisableAll}>
            Desativar livres
          </button>
        </div>
      </div>
      {props.feedbackMessage ? (
        <div className="availability-feedback" role="status" aria-live="polite">
          {props.feedbackMessage}
        </div>
      ) : null}
      <div className="availability-grid">
        {props.availability.map((slot) => (
          <button
            type="button"
            className={
              slot.reserved
                ? "availability-chip is-reserved"
                : slot.enabled
                  ? "availability-chip is-enabled"
                  : "availability-chip is-disabled"
            }
            key={slot.startsAt}
            disabled={slot.reserved && slot.enabled}
            onClick={() => props.onToggle(slot)}
          >
            <div className="availability-chip-head">
              <strong>{formatTime(slot.startsAt)}</strong>
            </div>
            <small>
              {slot.reserved
                ? "Reservado"
                : slot.enabled
                  ? "Disponivel"
                  : "Indisponivel"}
            </small>
          </button>
        ))}
      </div>
    </article>
  );
}
