import type { AppData, BusinessRules } from "../domain/types.ts";

export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  appointmentCompletionRule: "after_start",
  barberCancellationHours: 12,
  clientCancellationHours: 3,
  clientBookingNoticeHours: 2
};

export function normalizeBusinessRules(
  rules: Partial<BusinessRules> | null | undefined
): BusinessRules {
  return {
    appointmentCompletionRule:
      rules?.appointmentCompletionRule === "anytime" ? "anytime" : "after_start",
    barberCancellationHours: sanitizeHours(
      rules?.barberCancellationHours,
      DEFAULT_BUSINESS_RULES.barberCancellationHours
    ),
    clientCancellationHours: sanitizeHours(
      rules?.clientCancellationHours,
      DEFAULT_BUSINESS_RULES.clientCancellationHours
    ),
    clientBookingNoticeHours: sanitizeHours(
      rules?.clientBookingNoticeHours,
      DEFAULT_BUSINESS_RULES.clientBookingNoticeHours
    )
  };
}

export function getBusinessRules(data: AppData): BusinessRules {
  return normalizeBusinessRules(data.businessRules);
}

function sanitizeHours(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  if (value < 0) {
    return 0;
  }

  return Math.floor(value);
}
