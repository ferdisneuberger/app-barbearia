import { useState } from "react";
import type { FinancialSummary } from "../../app/types";
import { formatDateTime } from "../../app/utils";

type Props = {
  startDate: string;
  endDate: string;
  summary: FinancialSummary | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function FinancePanel(props: Props) {
  const [activeView, setActiveView] = useState<"consolidado" | "extrato">("consolidado");

  return (
    <article className="panel finance-panel">
      <div className="panel-head">
        <h2>Financeiro</h2>
        <div className="agenda-filters">
          <label className="compact-field">
            <span>Início</span>
            <input
              type="date"
              value={props.startDate}
              onChange={(event) => props.onStartDateChange(event.target.value)}
            />
          </label>
          <label className="compact-field">
            <span>Fim</span>
            <input
              type="date"
              value={props.endDate}
              onChange={(event) => props.onEndDateChange(event.target.value)}
            />
          </label>
        </div>
      </div>

      {props.summary ? (
        <>
          <div className="finance-cards">
            <div className="subpanel">
              <h3>Bruto</h3>
              <p>Previsto: {props.summary.grossPredictedLabel}</p>
              <p>Recebido: {props.summary.grossReceivedLabel}</p>
            </div>
            <div className="subpanel">
              <h3>Barbearia 30%</h3>
              <p>Previsto: {props.summary.shopPredictedLabel}</p>
              <p>Recebido: {props.summary.shopReceivedLabel}</p>
            </div>
            <div className="subpanel">
              <h3>Barbeiros 70%</h3>
              <p>Previsto: {props.summary.barberPredictedLabel}</p>
              <p>Recebido: {props.summary.barberReceivedLabel}</p>
            </div>
            <div className="subpanel">
              <h3>Status</h3>
              <p>Atendimentos: {props.summary.appointments}</p>
              <p>Pagos: {props.summary.paidAppointments}</p>
              <p>Pendentes: {props.summary.pendingAppointments}</p>
            </div>
          </div>

          <div className="subpanel">
            <div className="finance-section-head">
              <h3>{activeView === "consolidado" ? "Consolidado por barbeiro" : "Extrato"}</h3>
              <div className="tabs finance-tabs">
                <button
                  type="button"
                  className={activeView === "consolidado" ? "tab active-tab" : "tab"}
                  onClick={() => setActiveView("consolidado")}
                >
                  Consolidado
                </button>
                <button
                  type="button"
                  className={activeView === "extrato" ? "tab active-tab" : "tab"}
                  onClick={() => setActiveView("extrato")}
                >
                  Extrato
                </button>
              </div>
            </div>

            {activeView === "consolidado" ? (
              <div className="finance-table">
                {props.summary.byBarber.map((item) => (
                  <div key={item.barberId} className="finance-row">
                    <strong>{item.barberName}</strong>
                    <span>Atendimentos: {item.appointments}</span>
                    <span>Bruto recebido: {item.grossReceivedLabel}</span>
                    <span>Barbearia: {item.shopReceivedLabel}</span>
                    <span>Barbeiro: {item.barberReceivedLabel}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="finance-table">
                {props.summary.entries.map((entry) => (
                  <div key={entry.appointmentId} className="finance-row">
                    <strong>{formatDateTime(entry.startsAt)}</strong>
                    <span>{entry.clientName}</span>
                    <span>{entry.barberName}</span>
                    <span>{entry.serviceName}</span>
                    <span>{entry.paid ? "Pago" : "Pendente"}</span>
                    <span>Bruto: {entry.grossLabel}</span>
                    <span>Barbearia: {entry.shopLabel}</span>
                    <span>Barbeiro: {entry.barberLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="muted">Selecione um período para visualizar o financeiro.</p>
      )}
    </article>
  );
}
