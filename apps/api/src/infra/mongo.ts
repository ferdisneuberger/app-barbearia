import mongoose, { Schema } from "mongoose";
import type {
  AppData,
  Appointment,
  AvailabilitySlot,
  Barber,
  BusinessRules,
  Client,
  Service,
  User
} from "../domain/types.ts";
import { createDefaultBarberAvailability } from "../core/admin.ts";
import { hashPassword, isPasswordHash, verifyPassword } from "../core/password.ts";
import { DEFAULT_BUSINESS_RULES, normalizeBusinessRules } from "../core/rules.ts";
import { createDefaultAdminSeed, createDefaultBusinessRulesSeed } from "./seed.ts";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/barbearia";

const userSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
  },
  { versionKey: false }
);

const clientSchema = new Schema<Client>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true }
  },
  { versionKey: false }
);

const barberSchema = new Schema<Barber>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true },
    serviceIds: { type: [String], required: true }
  },
  { versionKey: false }
);

const serviceSchema = new Schema<Service>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    priceInCents: { type: Number, required: true },
    active: { type: Boolean, required: true, default: true }
  },
  { versionKey: false }
);

const appointmentSchema = new Schema<Appointment>(
  {
    id: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    barberId: { type: String, required: true },
    serviceId: { type: String, required: true },
    startsAt: { type: String, required: true },
    endsAt: { type: String, required: true },
    status: { type: String, required: true },
    paid: { type: Boolean, required: true },
    paidAt: { type: String, default: null },
    rescheduledAt: { type: String, default: null },
    rescheduledByRole: { type: String, default: null }
  },
  { versionKey: false }
);

const availabilitySchema = new Schema<AvailabilitySlot>(
  {
    barberId: { type: String, required: true },
    startsAt: { type: String, required: true },
    enabled: { type: Boolean, required: true }
  },
  { versionKey: false }
);

const businessRulesSchema = new Schema<BusinessRules>(
  {
    appointmentCompletionRule: { type: String, required: true },
    barberCancellationHours: { type: Number, required: true },
    clientCancellationHours: { type: Number, required: true },
    clientBookingNoticeHours: { type: Number, required: true }
  },
  { versionKey: false }
);

const UserModel = mongoose.models.User ?? mongoose.model<User>("User", userSchema);
const ClientModel = mongoose.models.Client ?? mongoose.model<Client>("Client", clientSchema);
const BarberModel = mongoose.models.Barber ?? mongoose.model<Barber>("Barber", barberSchema);
const ServiceModel = mongoose.models.Service ?? mongoose.model<Service>("Service", serviceSchema);
const AppointmentModel =
  mongoose.models.Appointment ?? mongoose.model<Appointment>("Appointment", appointmentSchema);
const AvailabilityModel =
  mongoose.models.Availability ??
  mongoose.model<AvailabilitySlot>("Availability", availabilitySchema);
const BusinessRulesModel =
  mongoose.models.BusinessRules ??
  mongoose.model<BusinessRules>("BusinessRules", businessRulesSchema);
let writeQueue = Promise.resolve();
type MongoDocument<T> = T & { _id?: unknown; __v?: unknown };

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(mongoUri);
}

export async function ensureAppDataConsistency() {
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    await UserModel.create(createDefaultAdminSeed());
    await BusinessRulesModel.create(createDefaultBusinessRulesSeed());
    return;
  }

  const availabilityCount = await AvailabilityModel.countDocuments();
  if (availabilityCount === 0) {
    const barbers = (await BarberModel.find().lean()).map((barber) =>
      stripMongoFields<Barber>(barber as MongoDocument<Barber>)
    );
    const recoveredAvailability = barbers.flatMap((barber) =>
      createDefaultBarberAvailability(barber.id)
    );

    if (recoveredAvailability.length > 0) {
      await AvailabilityModel.insertMany(recoveredAvailability);
    }
  }

  const rules = await BusinessRulesModel.findOne().lean();
  if (!rules) {
    await BusinessRulesModel.create(DEFAULT_BUSINESS_RULES);
  }

  const users = await UserModel.find().lean();
  const usersToUpgrade = users.filter((user) => !isPasswordHash(user.password));
  if (usersToUpgrade.length > 0) {
    await Promise.all(
      usersToUpgrade.map((user) =>
        UserModel.updateOne({ id: user.id }, { password: hashPassword(user.password) })
      )
    );
  }
}

export async function loadAppData(): Promise<AppData> {
  const [users, clients, barbers, services, appointments, availability, businessRules] = await Promise.all([
    UserModel.find().lean(),
    ClientModel.find().lean(),
    BarberModel.find().lean(),
    ServiceModel.find().lean(),
    AppointmentModel.find().lean(),
    AvailabilityModel.find().lean(),
    BusinessRulesModel.findOne().lean()
  ]);

  return {
    users: users.map((user) => stripMongoFields<User>(user as MongoDocument<User>)),
    clients: clients.map((client) => stripMongoFields<Client>(client as MongoDocument<Client>)),
    barbers: barbers.map((barber) => stripMongoFields<Barber>(barber as MongoDocument<Barber>)),
    services: services.map((service) => stripMongoFields<Service>(service as MongoDocument<Service>)),
    appointments: appointments.map((appointment) =>
      stripMongoFields<Appointment>(appointment as MongoDocument<Appointment>)
    ),
    availability: availability.map((slot) =>
      stripMongoFields<AvailabilitySlot>(slot as MongoDocument<AvailabilitySlot>)
    ),
    businessRules: normalizeBusinessRules(
      businessRules
        ? stripMongoFields<BusinessRules>(businessRules as MongoDocument<BusinessRules>)
        : undefined
    )
  };
}

export async function saveAppData(data: AppData) {
  await Promise.all([
    UserModel.deleteMany({}),
    ClientModel.deleteMany({}),
    BarberModel.deleteMany({}),
    ServiceModel.deleteMany({}),
    AppointmentModel.deleteMany({}),
    AvailabilityModel.deleteMany({}),
    BusinessRulesModel.deleteMany({})
  ]);

  await Promise.all([
    UserModel.insertMany(data.users),
    ClientModel.insertMany(data.clients),
    BarberModel.insertMany(data.barbers),
    ServiceModel.insertMany(data.services),
    AppointmentModel.insertMany(data.appointments),
    AvailabilityModel.insertMany(data.availability),
    BusinessRulesModel.insertMany([normalizeBusinessRules(data.businessRules)])
  ]);
}

export function mutateAppData<T>(mutator: (data: AppData) => Promise<T> | T) {
  const operation = writeQueue.then(async () => {
    const data = await loadAppData();
    const result = await mutator(data);
    await saveAppData(data);
    return result;
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined
  );

  return operation;
}

export async function findUserByCredentials(email: string, password: string) {
  const user = await UserModel.findOne({ email }).lean();
  if (!user) {
    return null;
  }

  const plainUser = stripMongoFields<User>(user as MongoDocument<User>);
  return verifyPassword(password, plainUser.password) ? plainUser : null;
}

function stripMongoFields<T>(document: MongoDocument<T>): T {
  const { _id: _ignoredId, __v: _ignoredVersion, ...plain } = document;
  return plain as T;
}
