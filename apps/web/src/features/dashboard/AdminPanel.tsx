import type { FormEventHandler } from "react";
import type {
  AppointmentCompletionRule,
  Barber,
  Client,
  FinancialSummary,
  Service,
  User
} from "../../app/types";

type AdminSection = "services" | "clients" | "barbers" | "admins" | "rules";

type Props = {
  services: Service[];
  clients: Client[];
  barbers: Barber[];
  admins: User[];
  financialSummary: FinancialSummary | null;
  activeSection: AdminSection;
  serviceName: string;
  servicePrice: string;
  editingServiceId: string | null;
  serviceAssignmentMode: "all" | "selected";
  serviceBarberIds: string[];
  clientName: string;
  clientEmail: string;
  clientPassword: string;
  barberName: string;
  barberEmail: string;
  barberPassword: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  barberServiceIds: string[];
  appointmentCompletionRule: AppointmentCompletionRule;
  barberCancellationHours: string;
  clientCancellationHours: string;
  clientBookingNoticeHours: string;
  onSectionChange: (value: AdminSection) => void;
  onServiceNameChange: (value: string) => void;
  onServicePriceChange: (value: string) => void;
  onToggleAllServiceBarbers: (checked: boolean) => void;
  onServiceBarbersChange: (barberId: string, checked: boolean) => void;
  onClientNameChange: (value: string) => void;
  onClientEmailChange: (value: string) => void;
  onClientPasswordChange: (value: string) => void;
  onBarberNameChange: (value: string) => void;
  onBarberEmailChange: (value: string) => void;
  onBarberPasswordChange: (value: string) => void;
  onAdminNameChange: (value: string) => void;
  onAdminEmailChange: (value: string) => void;
  onAdminPasswordChange: (value: string) => void;
  onAppointmentCompletionRuleChange: (value: AppointmentCompletionRule) => void;
  onBarberCancellationHoursChange: (value: string) => void;
  onClientCancellationHoursChange: (value: string) => void;
  onClientBookingNoticeHoursChange: (value: string) => void;
  onBarberServicesChange: (serviceId: string, checked: boolean) => void;
  onCreateService: FormEventHandler;
  onCreateClient: FormEventHandler;
  onCreateBarber: FormEventHandler;
  onCreateAdmin: FormEventHandler;
  onSaveBusinessRules: FormEventHandler;
  onDeleteClient: (clientId: string) => void;
  onDeleteBarber: (barberId: string) => void;
  onDeleteAdmin: (adminId: string) => void;
  onEditService: (serviceId: string) => void;
  onCancelServiceEdit: () => void;
  onDeleteService: (serviceId: string) => void;
  onToggleServiceActive: (serviceId: string, active: boolean) => void;
};

export function AdminPanel(props: Props) {
  const allBarbersSelected =
    props.barbers.length > 0 && props.serviceBarberIds.length === props.barbers.length;

  return (
    <>
      <article className="panel">
        <div className="panel-head">
          <h2>Administrativo</h2>
          <label className="compact-field">
            <span>Cadastro</span>
            <select
              value={props.activeSection}
              onChange={(event) => props.onSectionChange(event.target.value as AdminSection)}
            >
              <option value="services">Serviços</option>
              <option value="clients">Clientes</option>
              <option value="barbers">Barbeiros</option>
              <option value="admins">Admins</option>
              <option value="rules">Regras da barbearia</option>
            </select>
          </label>
        </div>

        {props.activeSection === "services" ? (
          <div className="admin-page-grid">
            <form className="stack" onSubmit={props.onCreateService}>
              <h3>{props.editingServiceId ? "Editar serviço" : "Novo serviço"}</h3>
              <label>
                Nome
                <input
                  value={props.serviceName}
                  onChange={(event) => props.onServiceNameChange(event.target.value)}
                />
              </label>
              <label>
                Preço em reais
                <input
                  type="text"
                  inputMode="numeric"
                  value={props.servicePrice}
                  onChange={(event) => props.onServicePriceChange(event.target.value)}
                />
              </label>
              <fieldset className="checkbox-group">
                <legend>Quem pode executar</legend>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={allBarbersSelected}
                    onChange={(event) => props.onToggleAllServiceBarbers(event.target.checked)}
                  />
                  <span>Marcar todos os barbeiros</span>
                </label>
                <div className="stack">
                  {props.barbers.map((barber) => (
                    <label key={barber.id} className="checkbox">
                      <input
                        type="checkbox"
                        checked={props.serviceBarberIds.includes(barber.id)}
                        onChange={(event) =>
                          props.onServiceBarbersChange(barber.id, event.target.checked)
                        }
                      />
                      <span>{barber.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit">
                {props.editingServiceId ? "Salvar serviço" : "Criar serviço"}
              </button>
              {props.editingServiceId ? (
                <button type="button" className="ghost" onClick={props.onCancelServiceEdit}>
                  Cancelar edição
                </button>
              ) : null}
            </form>

            <div className="subpanel">
              <h3>Serviços cadastrados</h3>
              {props.services.map((service) => (
                <div key={service.id} className="service-list-item">
                  <p>
                    {service.name} • R$ {(service.priceInCents / 100).toFixed(2)} •{" "}
                    {service.active ? "Ativo" : "Inativo"}
                  </p>
                  <div className="service-list-actions">
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => props.onEditService(service.id)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => props.onToggleServiceActive(service.id, !service.active)}
                    >
                      {service.active ? "Desativar" : "Reativar"}
                    </button>
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => props.onDeleteService(service.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {props.activeSection === "clients" ? (
          <div className="admin-page-grid">
            <form className="stack" onSubmit={props.onCreateClient}>
              <h3>Novo cliente</h3>
              <label>
                Nome
                <input
                  value={props.clientName}
                  onChange={(event) => props.onClientNameChange(event.target.value)}
                />
              </label>
              <label>
                E-mail
                <input
                  value={props.clientEmail}
                  onChange={(event) => props.onClientEmailChange(event.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={props.clientPassword}
                  onChange={(event) => props.onClientPasswordChange(event.target.value)}
                />
              </label>
              <button type="submit">Cadastrar cliente</button>
            </form>

            <div className="subpanel">
              <h3>Clientes cadastrados</h3>
              {props.clients.map((client) => (
                <div key={client.id} className="service-list-item">
                  <p>
                    {client.name} • {client.email}
                  </p>
                  <div className="service-list-actions">
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => props.onDeleteClient(client.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {props.activeSection === "barbers" ? (
          <div className="admin-page-grid">
            <form className="stack" onSubmit={props.onCreateBarber}>
              <h3>Novo barbeiro</h3>
              <label>
                Nome
                <input
                  value={props.barberName}
                  onChange={(event) => props.onBarberNameChange(event.target.value)}
                />
              </label>
              <label>
                E-mail
                <input
                  value={props.barberEmail}
                  onChange={(event) => props.onBarberEmailChange(event.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={props.barberPassword}
                  onChange={(event) => props.onBarberPasswordChange(event.target.value)}
                />
              </label>
              <fieldset className="checkbox-group">
                <legend>Serviços habilitados</legend>
                {props.services.map((service) => (
                  <label key={service.id} className="checkbox">
                    <input
                      type="checkbox"
                      checked={props.barberServiceIds.includes(service.id)}
                      onChange={(event) =>
                        props.onBarberServicesChange(service.id, event.target.checked)
                      }
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
              </fieldset>
              <button type="submit">Cadastrar barbeiro</button>
            </form>

            <div className="subpanel">
              <h3>Barbeiros cadastrados</h3>
              {props.barbers.map((barber) => (
                <div key={barber.id} className="service-list-item">
                  <p>
                    {barber.name} • {barber.email}
                  </p>
                  <div className="service-list-actions">
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => props.onDeleteBarber(barber.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {props.activeSection === "admins" ? (
          <div className="admin-page-grid">
            <form className="stack" onSubmit={props.onCreateAdmin}>
              <h3>Novo admin</h3>
              <label>
                Nome
                <input
                  value={props.adminName}
                  onChange={(event) => props.onAdminNameChange(event.target.value)}
                />
              </label>
              <label>
                E-mail
                <input
                  value={props.adminEmail}
                  onChange={(event) => props.onAdminEmailChange(event.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={props.adminPassword}
                  onChange={(event) => props.onAdminPasswordChange(event.target.value)}
                />
              </label>
              <button type="submit">Cadastrar admin</button>
            </form>

            <div className="subpanel">
              <h3>Admins cadastrados</h3>
              {props.admins.map((admin) => (
                <div key={admin.id} className="service-list-item">
                  <p>
                    {admin.name} • {admin.email}
                  </p>
                  <div className="service-list-actions">
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => props.onDeleteAdmin(admin.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {props.activeSection === "rules" ? (
          <div className="admin-page-grid">
            <form className="stack" onSubmit={props.onSaveBusinessRules}>
              <h3>Regras da barbearia</h3>
              <label>
                Quando o atendimento pode ser concluído
                <select
                  value={props.appointmentCompletionRule}
                  onChange={(event) =>
                    props.onAppointmentCompletionRuleChange(
                      event.target.value as AppointmentCompletionRule
                    )
                  }
                >
                  <option value="after_start">Após iniciar o atendimento</option>
                  <option value="anytime">A qualquer momento</option>
                </select>
              </label>
              <label>
                Horas mínimas para o barbeiro cancelar ou remarcar
                <input
                  type="number"
                  min="0"
                  value={props.barberCancellationHours}
                  onChange={(event) => props.onBarberCancellationHoursChange(event.target.value)}
                />
              </label>
              <label>
                Horas mínimas para o cliente cancelar ou remarcar
                <input
                  type="number"
                  min="0"
                  value={props.clientCancellationHours}
                  onChange={(event) => props.onClientCancellationHoursChange(event.target.value)}
                />
              </label>
              <label>
                Horas mínimas de antecedência para o cliente agendar
                <input
                  type="number"
                  min="0"
                  value={props.clientBookingNoticeHours}
                  onChange={(event) => props.onClientBookingNoticeHoursChange(event.target.value)}
                />
              </label>
              <button type="submit">Salvar regras</button>
            </form>

            <div className="subpanel">
              <h3>Resumo atual</h3>
              <p>
                Conclusão:{" "}
                {props.appointmentCompletionRule === "anytime"
                  ? "a qualquer momento"
                  : "após iniciar o atendimento"}
              </p>
              <p>
                Barbeiro pode cancelar/remarcar com {props.barberCancellationHours || "0"} horas
                de antecedência.
              </p>
              <p>
                Cliente pode cancelar/remarcar com {props.clientCancellationHours || "0"} horas
                de antecedência.
              </p>
              <p>
                Cliente pode agendar com {props.clientBookingNoticeHours || "0"} horas de
                antecedência.
              </p>
            </div>
          </div>
        ) : null}
      </article>

      {props.financialSummary ? (
        <article className="panel accent">
          <h2>Financeiro do dia</h2>
          <p>Total de atendimentos: {props.financialSummary.appointments}</p>
          <p>Bruto previsto: {props.financialSummary.grossPredictedLabel}</p>
          <p>Bruto recebido: {props.financialSummary.grossReceivedLabel}</p>
        </article>
      ) : null}
    </>
  );
}
