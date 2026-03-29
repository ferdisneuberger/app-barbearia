import type { FormEventHandler } from "react";
import type { Barber, Client, FinancialSummary, Service } from "../../app/types";

type Props = {
  services: Service[];
  clients: Client[];
  barbers: Barber[];
  financialSummary: FinancialSummary | null;
  serviceName: string;
  servicePrice: string;
  clientName: string;
  clientEmail: string;
  clientPassword: string;
  barberName: string;
  barberEmail: string;
  barberPassword: string;
  barberServiceIds: string[];
  onServiceNameChange: (value: string) => void;
  onServicePriceChange: (value: string) => void;
  onClientNameChange: (value: string) => void;
  onClientEmailChange: (value: string) => void;
  onClientPasswordChange: (value: string) => void;
  onBarberNameChange: (value: string) => void;
  onBarberEmailChange: (value: string) => void;
  onBarberPasswordChange: (value: string) => void;
  onBarberServicesChange: (serviceId: string, checked: boolean) => void;
  onCreateService: FormEventHandler;
  onCreateClient: FormEventHandler;
  onCreateBarber: FormEventHandler;
  onDeactivateService: (serviceId: string) => void;
};

export function AdminPanel(props: Props) {
  return (
    <>
      <article className="panel">
        <h2>Cadastros</h2>
        <div className="admin-grid">
          <form className="stack" onSubmit={props.onCreateService}>
            <h3>Novo servico</h3>
            <label>
              Nome
              <input
                value={props.serviceName}
                onChange={(event) => props.onServiceNameChange(event.target.value)}
              />
            </label>
            <label>
              Preco em reais
              <input
                type="number"
                min="0"
                step="0.01"
                value={props.servicePrice}
                onChange={(event) => props.onServicePriceChange(event.target.value)}
              />
            </label>
            <button type="submit">Criar servico</button>
          </form>

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
              <legend>Servicos habilitados</legend>
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
        </div>

        <div className="admin-grid">
          <div className="subpanel">
            <h3>Servicos</h3>
            {props.services.map((service) => (
              <div key={service.id} className="inline-actions">
                <p>
                  {service.name} • R$ {(service.priceInCents / 100).toFixed(2)} •{" "}
                  {service.active ? "Ativo" : "Inativo"}
                </p>
                {service.active ? (
                  <button
                    type="button"
                    className="ghost small"
                    onClick={() => props.onDeactivateService(service.id)}
                  >
                    Desativar
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="subpanel">
            <h3>Clientes</h3>
            {props.clients.map((client) => (
              <p key={client.id}>
                {client.name} • {client.email}
              </p>
            ))}
          </div>
          <div className="subpanel">
            <h3>Barbeiros</h3>
            {props.barbers.map((barber) => (
              <p key={barber.id}>
                {barber.name} • {barber.email}
              </p>
            ))}
          </div>
        </div>
      </article>

      {props.financialSummary ? (
        <article className="panel accent">
          <h2>Financeiro do dia</h2>
          <p>Total de atendimentos: {props.financialSummary.appointments}</p>
          <p>Receita prevista: {props.financialSummary.predictedLabel}</p>
          <p>Recebido: {props.financialSummary.receivedLabel}</p>
        </article>
      ) : null}
    </>
  );
}
