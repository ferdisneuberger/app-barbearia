const TIME_ZONE = "America/Sao_Paulo";
const BUSINESS_OPEN_TIME = "08:00";
const BUSINESS_LAST_SLOT_TIME = "19:15";
const BRASILIA_OFFSET_HOURS = 3;
const SLOT_TIME_ANCHOR_DATE = "2026-01-01";

export const APPOINTMENT_DURATION_MINUTES = 45;
export const CLIENT_RESCHEDULE_HOURS = 3;
export const BARBER_RESCHEDULE_HOURS = 12;
export const MIN_BOOKING_NOTICE_HOURS = 2;

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function diffHours(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / 3_600_000;
}

export function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

export function isWithinBusinessHours(date: Date) {
  const time = date.toLocaleTimeString("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  return time >= BUSINESS_OPEN_TIME && time <= BUSINESS_LAST_SLOT_TIME;
}

export function buildIso(date: string, time: string) {
  return `${date}T${time}:00-03:00`;
}

export function toBrasiliaIso(date: Date) {
  return new Date(date.getTime() - BRASILIA_OFFSET_HOURS * 3_600_000).toISOString().slice(0, 19) + "-03:00";
}

export function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export function timeKey(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
}

export function createDailySlotTimes() {
  return createSlotTimesBetween(BUSINESS_OPEN_TIME, BUSINESS_LAST_SLOT_TIME);
}

export function createSlotTimesBetween(startTime: string, endTime: string) {
  const times: string[] = [];
  let cursor = new Date(`${SLOT_TIME_ANCHOR_DATE}T${startTime}:00-03:00`);
  const end = new Date(`${SLOT_TIME_ANCHOR_DATE}T${endTime}:00-03:00`);

  while (cursor <= end) {
    times.push(
      cursor.toLocaleTimeString("en-GB", {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      })
    );
    cursor = addMinutes(cursor, APPOINTMENT_DURATION_MINUTES);
  }

  return times;
}
