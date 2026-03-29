import { AppHeader } from "../components/AppHeader";
import { LoginCard } from "../components/LoginCard";
import { RegisterCard } from "../components/RegisterCard";
import { AdminPanel } from "../features/dashboard/AdminPanel";
import { AppointmentModal } from "../features/schedule/AppointmentModal";
import { AppointmentsPanel } from "../features/schedule/AppointmentsPanel";
import { AvailabilityPanel } from "../features/schedule/AvailabilityPanel";
import { BookingPanel } from "../features/schedule/BookingPanel";
import { useBarbershopApp } from "./useBarbershopApp";

type BarbershopApp = ReturnType<typeof useBarbershopApp>;
type NavTabItem = Readonly<{ id: string; label: string }>;

type NavTabsProps = Readonly<{
  items: readonly NavTabItem[];
  active: string;
  onChange: (id: string) => void;
}>;

function NavTabs(props: NavTabsProps) {
  return (
    <div className="tabs">
      {props.items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={props.active === item.id ? "tab active-tab" : "tab"}
          onClick={() => props.onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="shell">
      <section className="login-card">
        <h1>Validando sessao...</h1>
      </section>
    </main>
  );
}

function AppMessageBar(props: Readonly<{ message: string; onClose: () => void }>) {
  if (!props.message) {
    return null;
  }

  return (
    <div className="app-message" role="alert" aria-live="polite">
      <p>{props.message}</p>
      <button type="button" className="ghost small" onClick={props.onClose}>
        Fechar
      </button>
    </div>
  );
}

function AuthScreen(props: Readonly<{ app: BarbershopApp }>) {
  const { app } = props;

  return (
    <main className="shell">
      {app.authScreen === "login" ? (
        <LoginCard
          email={app.email}
          password={app.password}
          message={app.message}
          onEmailChange={app.setEmail}
          onPasswordChange={app.setPassword}
          onSubmit={app.handleLogin}
          onGoToRegister={() => {
            app.setMessage("");
            app.setAuthScreen("register");
          }}
        />
      ) : (
        <RegisterCard
          name={app.registerName}
          email={app.registerEmail}
          password={app.registerPassword}
          message={app.message}
          onNameChange={app.setRegisterName}
          onEmailChange={app.setRegisterEmail}
          onPasswordChange={app.setRegisterPassword}
          onSubmit={app.handleRegister}
          onGoToLogin={() => {
            app.setMessage("");
            app.setAuthScreen("login");
          }}
        />
      )}
    </main>
  );
}

function renderRoleTabs(app: BarbershopApp) {
  if (app.user?.role === "admin") {
    return (
      <NavTabs
        items={[
          { id: "agenda", label: "Agenda" },
          { id: "administrativo", label: "Administrativo" },
          { id: "financeiro", label: "Financeiro" }
        ]}
        active={app.adminView}
        onChange={(value) => app.setAdminView(value as "agenda" | "administrativo" | "financeiro")}
      />
    );
  }

  if (app.user?.role === "barber") {
    return (
      <NavTabs
        items={[
          { id: "agenda", label: "Agenda" },
          { id: "disponibilidade", label: "Disponibilidade" }
        ]}
        active={app.barberView}
        onChange={(value) => app.setBarberView(value as "agenda" | "disponibilidade")}
      />
    );
  }

  return null;
}

function renderAdminAgenda(app: BarbershopApp) {
  return (
    <>
      <BookingPanel
        role={app.user!.role}
        clients={app.clients}
        barbers={app.barbers}
        services={app.barberServices}
        selectedDate={app.selectedDate}
        selectedClientId={app.selectedClientId}
        selectedBarberId={app.selectedBarberId}
        selectedServiceId={app.selectedServiceId}
        selectedTime={app.selectedTime}
        availableTimes={app.availableTimes}
        bookingMonth={app.bookingMonth}
        monthAvailability={app.bookingMonthAvailability}
        message={app.message}
        onBookingMonthChange={app.handleBookingMonthChange}
        onDateChange={app.setSelectedDate}
        onClientChange={app.setSelectedClientId}
        onBarberChange={app.setSelectedBarberId}
        onServiceChange={app.setSelectedServiceId}
        onTimeChange={app.setSelectedTime}
        onSubmit={app.handleCreateAppointment}
      />

      <AppointmentsPanel
        role={app.user!.role}
        appointments={app.filteredAppointments}
        search={app.adminSearch}
        barberFilter={app.adminBarberFilter}
        serviceFilter={app.adminServiceFilter}
        statusFilter={app.appointmentStatusFilter}
        barbers={app.barbers}
        services={app.services}
        onSearchChange={app.setAdminSearch}
        onBarberFilterChange={app.setAdminBarberFilter}
        onServiceFilterChange={app.setAdminServiceFilter}
        onStatusFilterChange={app.setAppointmentStatusFilter}
        menuAppointmentId={app.menuAppointmentId}
        onMenuToggle={(appointmentId) =>
          app.setMenuAppointmentId((current) => (current === appointmentId ? null : appointmentId))
        }
        onComplete={app.handleComplete}
        onPay={app.handlePay}
        onManage={app.openActionModal}
      />
    </>
  );
}

function renderAdminContent(app: BarbershopApp) {
  if (app.adminView === "agenda") {
    return renderAdminAgenda(app);
  }

  if (app.adminView === "administrativo") {
    return (
      <AdminPanel
        services={app.services}
        clients={app.clients}
        barbers={app.barbers}
        financialSummary={null}
        serviceName={app.serviceName}
        servicePrice={app.servicePrice}
        clientName={app.clientName}
        clientEmail={app.clientEmail}
        clientPassword={app.clientPassword}
        barberName={app.barberName}
        barberEmail={app.barberEmail}
        barberPassword={app.barberPassword}
        barberServiceIds={app.barberServiceIds}
        onServiceNameChange={app.setServiceName}
        onServicePriceChange={app.setServicePrice}
        onClientNameChange={app.setClientName}
        onClientEmailChange={app.setClientEmail}
        onClientPasswordChange={app.setClientPassword}
        onBarberNameChange={app.setBarberName}
        onBarberEmailChange={app.setBarberEmail}
        onBarberPasswordChange={app.setBarberPassword}
        onBarberServicesChange={(serviceId, checked) =>
          app.setBarberServiceIds((current) =>
            checked ? [...current, serviceId] : current.filter((item) => item !== serviceId)
          )
        }
        onCreateService={app.handleCreateService}
        onCreateClient={app.handleCreateClient}
        onCreateBarber={app.handleCreateBarber}
        onDeactivateService={app.handleDeactivateService}
      />
    );
  }

  if (!app.financialSummary) {
    return null;
  }

  return (
    <article className="panel accent">
      <h2>Financeiro do dia</h2>
      <p>Total de atendimentos: {app.financialSummary.appointments}</p>
      <p>Receita prevista: {app.financialSummary.predictedLabel}</p>
      <p>Recebido: {app.financialSummary.receivedLabel}</p>
    </article>
  );
}

function renderBarberContent(app: BarbershopApp) {
  if (app.barberView === "disponibilidade") {
    return (
      <AvailabilityPanel
        role={app.user!.role}
        selectedDate={app.selectedDate}
        availability={app.availability}
        feedbackMessage={app.availabilityFeedback}
        onDateChange={app.setSelectedDate}
        onEnableAll={app.handleEnableAllAvailability}
        onDisableAll={app.handleDisableAllAvailability}
        onToggle={app.handleToggle}
      />
    );
  }

  return (
    <AppointmentsPanel
      role={app.user!.role}
      appointments={app.filteredAppointments}
      selectedDate={app.selectedDate}
      statusFilter={app.appointmentStatusFilter}
      onDateChange={app.setSelectedDate}
      onStatusFilterChange={app.setAppointmentStatusFilter}
      menuAppointmentId={app.menuAppointmentId}
      onMenuToggle={(appointmentId) =>
        app.setMenuAppointmentId((current) => (current === appointmentId ? null : appointmentId))
      }
      onComplete={app.handleComplete}
      onPay={app.handlePay}
      onManage={app.openActionModal}
    />
  );
}

function renderClientContent(app: BarbershopApp) {
  return (
    <AppointmentsPanel
      role={app.user!.role}
      appointments={app.filteredAppointments}
      statusFilter={app.appointmentStatusFilter}
      onStatusFilterChange={app.setAppointmentStatusFilter}
      menuAppointmentId={app.menuAppointmentId}
      onMenuToggle={(appointmentId) =>
        app.setMenuAppointmentId((current) => (current === appointmentId ? null : appointmentId))
      }
      onComplete={app.handleComplete}
      onPay={app.handlePay}
      onManage={app.openActionModal}
    />
  );
}

function renderMainContent(app: BarbershopApp) {
  if (app.user?.role === "admin") {
    return renderAdminContent(app);
  }

  if (app.user?.role === "barber") {
    return renderBarberContent(app);
  }

  return renderClientContent(app);
}

function ClientBookingModal(props: Readonly<{ app: BarbershopApp }>) {
  const { app } = props;

  if (!app.showBookingModal) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <button
        type="button"
        className="modal-dismiss-layer"
        aria-label="Fechar modal de agendamento"
        onClick={() => app.setShowBookingModal(false)}
      />
      <section className="modal-card">
        <BookingPanel
          role={app.user!.role}
          clients={app.clients}
          barbers={app.availableBarbers}
          services={app.barberServices}
          selectedDate={app.selectedDate}
          selectedClientId={app.selectedClientId}
          selectedBarberId={app.selectedBarberId}
          selectedServiceId={app.selectedServiceId}
          selectedTime={app.selectedTime}
          availableTimes={app.clientAvailableTimes}
          bookingMonth={app.bookingMonth}
          monthAvailability={app.bookingMonthAvailability}
          message={app.message}
          onBookingMonthChange={app.handleBookingMonthChange}
          onDateChange={app.setSelectedDate}
          onClientChange={app.setSelectedClientId}
          onBarberChange={app.handleBookingBarberChange}
          onServiceChange={app.setSelectedServiceId}
          onTimeChange={app.setSelectedTime}
          onSubmit={app.handleCreateAppointment}
        />
      </section>
    </div>
  );
}

export function App() {
  const app = useBarbershopApp();

  if (!app.authReady) {
    return <LoadingScreen />;
  }

  if (!app.user) {
    return <AuthScreen app={app} />;
  }

  const modalBarber = app.barbers.find((barber) => barber.id === app.actionModal?.appointment.barberId);

  return (
    <main className="shell">
      <AppHeader
        user={app.user}
        onLogout={() => {
          app.clearSession();
          app.setMessage("");
        }}
      />
      <AppMessageBar
        message={app.message}
        onClose={() => app.setMessage("")}
      />
      {renderRoleTabs(app)}
      <section className="layout">{renderMainContent(app)}</section>

      {app.user.role === "client" ? (
        <button
          className="fab"
          type="button"
          aria-label="Novo agendamento"
          title="Novo agendamento"
          onClick={app.openBookingModal}
        >
          +
        </button>
      ) : null}

      <ClientBookingModal app={app} />

      <AppointmentModal
        role={app.user.role}
        actionModal={app.actionModal}
        services={app.activeServices}
        modalTimes={app.modalTimes}
        allowedServiceIds={modalBarber?.serviceIds ?? []}
        onClose={() => app.setActionModal(null)}
        onDateChange={app.updateModalDate}
        onServiceChange={(serviceId) =>
          app.setActionModal((current) => (current ? { ...current, serviceId } : current))
        }
        onTimeChange={(time) =>
          app.setActionModal((current) => (current ? { ...current, time } : current))
        }
        onSave={app.handleSaveAppointmentChanges}
        onCancel={app.handleCancelAppointment}
        onDelete={app.handleDeleteAppointment}
      />
    </main>
  );
}
