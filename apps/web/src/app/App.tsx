import { AppHeader } from "../components/AppHeader";
import { FinancePanel } from "../features/dashboard/FinancePanel";
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

type NavSelectProps = Readonly<{
  items: readonly NavTabItem[];
  active: string;
  label: string;
  onChange: (id: string) => void;
}>;

function NavSelect(props: NavSelectProps) {
  return (
    <div className="panel-head nav-select-wrap">
      <label className="compact-field">
        <span>{props.label}</span>
        <select value={props.active} onChange={(event) => props.onChange(event.target.value)}>
          {props.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="shell">
      <section className="login-card">
        <h1>Validando sessão...</h1>
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
      <NavSelect
        items={[
          { id: "home", label: "Agenda" },
          { id: "agendamento", label: "Novo agendamento" },
          { id: "administrativo", label: "Administrativo" },
          { id: "financeiro", label: "Financeiro" }
        ]}
        label="Página"
        active={app.adminView}
        onChange={(value) =>
          app.handleAdminViewChange(
            value as "home" | "agendamento" | "administrativo" | "financeiro"
          )
        }
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

function renderAdminHome(app: BarbershopApp) {
  return (
      <AppointmentsPanel
        role={app.user!.role}
        appointments={app.filteredAppointments}
        selectedDate={app.selectedDate}
        adminScheduleScope={app.adminScheduleScope}
        adminMonth={app.adminMonth}
        search={app.adminSearch}
        barberFilter={app.adminBarberFilter}
        serviceFilter={app.adminServiceFilter}
        statusFilter={app.appointmentStatusFilter}
        barbers={app.barbers}
        services={app.services}
        onDateChange={app.setSelectedDate}
        onAdminScheduleScopeChange={app.setAdminScheduleScope}
        onAdminMonthChange={app.setAdminMonth}
        onSearchChange={app.setAdminSearch}
        onBarberFilterChange={app.setAdminBarberFilter}
      onServiceFilterChange={app.setAdminServiceFilter}
      onStatusFilterChange={app.setAppointmentStatusFilter}
      businessRules={app.businessRules}
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

function renderAdminBooking(app: BarbershopApp) {
  return (
    <BookingPanel
      role={app.user!.role}
      clients={app.clients}
      filteredClients={app.filteredBookingClients}
      barbers={app.barbers}
      filteredBarbers={app.filteredBookingBarbersByService}
      services={app.activeServices}
      selectedDate={app.selectedDate}
      selectedClientId={app.selectedClientId}
      clientSearch={app.bookingClientSearch}
      selectedBarberId={app.selectedBarberId}
      barberSearch={app.bookingBarberSearch}
      selectedServiceId={app.selectedServiceId}
      selectedTime={app.selectedTime}
      availableTimes={app.availableTimes}
      bookingMonth={app.bookingMonth}
      monthAvailability={app.bookingMonthAvailability}
      message={app.message}
      onBookingMonthChange={app.handleBookingMonthChange}
      onDateChange={app.setSelectedDate}
      onClientChange={app.handleAdminBookingClientChange}
      onClientSearchChange={app.handleBookingClientSearchChange}
      onBarberChange={app.handleBookingBarberChange}
      onBarberSearchChange={app.handleBookingBarberSearchChange}
      onServiceChange={app.handleAdminBookingServiceChange}
      onTimeChange={app.setSelectedTime}
      onSubmit={app.handleCreateAppointment}
    />
  );
}

function renderAdminContent(app: BarbershopApp) {
  if (app.adminView === "home") {
    return renderAdminHome(app);
  }

  if (app.adminView === "agendamento") {
    return renderAdminBooking(app);
  }

  if (app.adminView === "administrativo") {
    return (
      <AdminPanel
        services={app.services}
        clients={app.clients}
        barbers={app.barbers}
        admins={app.admins}
        financialSummary={null}
        activeSection={app.adminManagementView}
        serviceName={app.serviceName}
        servicePrice={app.servicePrice}
        editingServiceId={app.editingServiceId}
        serviceAssignmentMode={app.serviceAssignmentMode}
        serviceBarberIds={app.serviceBarberIds}
        clientName={app.clientName}
        clientEmail={app.clientEmail}
        clientPassword={app.clientPassword}
        barberName={app.barberName}
        barberEmail={app.barberEmail}
        barberPassword={app.barberPassword}
        adminName={app.adminName}
        adminEmail={app.adminEmail}
        adminPassword={app.adminPassword}
        barberServiceIds={app.barberServiceIds}
        appointmentCompletionRule={app.appointmentCompletionRule}
        barberCancellationHours={app.barberCancellationHours}
        clientCancellationHours={app.clientCancellationHours}
        clientBookingNoticeHours={app.clientBookingNoticeHours}
        onSectionChange={app.setAdminManagementView}
        onServiceNameChange={app.setServiceName}
        onServicePriceChange={app.handleServicePriceChange}
        onToggleAllServiceBarbers={(checked) => {
          app.setServiceAssignmentMode(checked ? "all" : "selected");
          app.setServiceBarberIds(checked ? app.barbers.map((barber) => barber.id) : []);
        }}
        onServiceBarbersChange={(barberId, checked) =>
          app.setServiceBarberIds((current) => {
            const next = checked
              ? [...current, barberId]
              : current.filter((item) => item !== barberId);

            app.setServiceAssignmentMode(
              next.length === app.barbers.length && app.barbers.length > 0 ? "all" : "selected"
            );

            return next;
          })
        }
        onClientNameChange={app.setClientName}
        onClientEmailChange={app.setClientEmail}
        onClientPasswordChange={app.setClientPassword}
        onBarberNameChange={app.setBarberName}
        onBarberEmailChange={app.setBarberEmail}
        onBarberPasswordChange={app.setBarberPassword}
        onAdminNameChange={app.setAdminName}
        onAdminEmailChange={app.setAdminEmail}
        onAdminPasswordChange={app.setAdminPassword}
        onAppointmentCompletionRuleChange={app.setAppointmentCompletionRule}
        onBarberCancellationHoursChange={app.setBarberCancellationHours}
        onClientCancellationHoursChange={app.setClientCancellationHours}
        onClientBookingNoticeHoursChange={app.setClientBookingNoticeHours}
        onBarberServicesChange={(serviceId, checked) =>
          app.setBarberServiceIds((current) =>
            checked ? [...current, serviceId] : current.filter((item) => item !== serviceId)
          )
        }
        onCreateService={app.handleCreateService}
        onCreateClient={app.handleCreateClient}
        onCreateBarber={app.handleCreateBarber}
        onCreateAdmin={app.handleCreateAdmin}
        onEditService={app.handleEditService}
        onCancelServiceEdit={app.resetServiceForm}
        onDeleteService={app.handleDeleteService}
        onDeleteClient={app.handleDeleteClient}
        onDeleteBarber={app.handleDeleteBarber}
        onDeleteAdmin={app.handleDeleteAdmin}
        onToggleServiceActive={app.handleToggleServiceActive}
        onSaveBusinessRules={app.handleSaveBusinessRules}
      />
    );
  }

  return (
    <FinancePanel
      startDate={app.financialStartDate}
      endDate={app.financialEndDate}
      summary={app.financialSummary}
      onStartDateChange={app.setFinancialStartDate}
      onEndDateChange={app.setFinancialEndDate}
    />
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
      search={app.adminSearch}
      statusFilter={app.appointmentStatusFilter}
      onDateChange={app.setSelectedDate}
      onSearchChange={app.setAdminSearch}
      onStatusFilterChange={app.setAppointmentStatusFilter}
      businessRules={app.businessRules}
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
      search={app.adminSearch}
      statusFilter={app.appointmentStatusFilter}
      onSearchChange={app.setAdminSearch}
      onStatusFilterChange={app.setAppointmentStatusFilter}
      businessRules={app.businessRules}
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
          filteredBarbers={app.filteredBookingBarbersByService}
          services={app.barberServices}
          selectedDate={app.selectedDate}
          selectedClientId={app.selectedClientId}
          selectedBarberId={app.selectedBarberId}
          barberSearch={app.bookingBarberSearch}
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
          onBarberSearchChange={app.handleBookingBarberSearchChange}
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
        clientCancellationHours={app.businessRules.clientCancellationHours}
      />
    </main>
  );
}
