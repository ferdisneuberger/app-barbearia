import type { ActionModalState, Role, Service } from "../../app/types";

type Props = {
  role: Role;
  actionModal: ActionModalState | null;
  services: Service[];
  modalTimes: string[];
  allowedServiceIds: string[];
  onClose: () => void;
  onDateChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onSave: () => void;
  onCancel: (appointmentId: string) => void;
  onDelete: (appointmentId: string) => void;
};

export function AppointmentModal(props: Props) {
  if (!props.actionModal) {
    return null;
  }

  const appointment = props.actionModal.appointment;

  return (
    <div className="modal-backdrop">
      <button
        type="button"
        className="modal-dismiss-layer"
        aria-label="Fechar modal de agendamento"
        onClick={props.onClose}
      />
      <section className="modal-card">
        <h2>{props.role === "client" ? "Cancelar agendamento" : "Gerenciar agendamento"}</h2>
        <p className="muted">
          {props.role === "client" ? appointment.barberName : appointment.clientName}
        </p>

        {props.role !== "client" ? (
          <div className="stack">
            <label>
              Data
              <input
                type="date"
                value={props.actionModal.date}
                onChange={(event) => props.onDateChange(event.target.value)}
              />
            </label>

            <label>
              Servico
              <select
                value={props.actionModal.serviceId}
                onChange={(event) => props.onServiceChange(event.target.value)}
              >
                {props.services
                  .filter((service) => props.allowedServiceIds.includes(service.id))
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Horario
              <select
                value={props.actionModal.time}
                onChange={(event) => props.onTimeChange(event.target.value)}
              >
                {props.modalTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="stack">
            <p>Tem certeza que deseja cancelar este agendamento?</p>
            <p className="muted">
              Cancelamentos so podem ser realizados com no minimo 3 horas de antecedencia.
            </p>
          </div>
        )}

        <div className="modal-actions">
          {props.role !== "client" ? (
            <button
              onClick={props.onSave}
              disabled={props.modalTimes.length === 0 || !props.actionModal.time}
            >
              Salvar alteracoes
            </button>
          ) : null}
          {props.role === "client" ? (
            <>
              <button className="ghost" onClick={props.onClose}>
                Voltar
              </button>
              <button
                className="danger"
                onClick={() => props.onCancel(appointment.id)}
              >
                Confirmar cancelamento
              </button>
            </>
          ) : (
            <button
              className="ghost"
              onClick={() => props.onCancel(appointment.id)}
            >
              Cancelar agendamento
            </button>
          )}
          {props.role === "admin" ? (
            <button
              className="danger"
              onClick={() => props.onDelete(appointment.id)}
            >
              Excluir agendamento
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
