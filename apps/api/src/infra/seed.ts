import type { BusinessRules, User } from "../domain/types.ts";
import { createId } from "../core/id.ts";
import { hashPassword } from "../core/password.ts";
import { DEFAULT_BUSINESS_RULES } from "../core/rules.ts";

export function createDefaultAdminSeed(): User {
  return {
    id: createId(),
    name: "Admin Barbearia",
    email: "admin@barbearia.local",
    password: hashPassword("123456"),
    role: "admin"
  };
}

export function createDefaultBusinessRulesSeed(): BusinessRules {
  return { ...DEFAULT_BUSINESS_RULES };
}
