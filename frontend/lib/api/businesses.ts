import { apiRequest } from "./client";
import type { Account, Business } from "@/lib/types";
import type { BackendCurrency } from "@/lib/currency";
import type { CurrentUserResponse } from "@/lib/api/auth";

interface BackendBusiness {
  id: string;
  name: string;
  language: "en" | "fa";
  base_currency: BackendCurrency;
  is_current: boolean;
}

interface BackendAccount {
  id: string;
  code: string | null;
  name: string;
  account_type: Account["type"];
  balance: string | number;
}

function normalizeBusiness(b: BackendBusiness): Business {
  return { id: b.id, name: b.name, currency: b.base_currency, isCurrent: b.is_current };
}

function normalizeAccount(a: BackendAccount): Account {
  return { id: a.id, name: a.name, type: a.account_type, balance: Number(a.balance) };
}

export function listBusinesses(): Promise<Business[]> {
  return apiRequest<BackendBusiness[]>("/api/businesses").then((rows) => rows.map(normalizeBusiness));
}

export function createBusiness(name: string, baseCurrency: BackendCurrency, language: "en" | "fa" = "fa") {
  return apiRequest<BackendBusiness>("/api/businesses", {
    method: "POST",
    body: { name, base_currency: baseCurrency, language },
  }).then(normalizeBusiness);
}

/** Only the name is editable — base_currency is locked forever at creation
 *  and the backend rejects any attempt to send it (see BusinessUpdate). */
export function updateBusiness(businessId: string, changes: { name: string }) {
  return apiRequest<BackendBusiness>(`/api/businesses/${businessId}`, {
    method: "PATCH",
    body: changes,
  }).then(normalizeBusiness);
}

export function deleteBusiness(businessId: string) {
  return apiRequest<void>(`/api/businesses/${businessId}`, { method: "DELETE" });
}

export function switchBusiness(businessId: string) {
  return apiRequest<CurrentUserResponse>("/api/auth/switch-business", {
    method: "POST",
    body: { business_id: businessId },
  });
}

export function getBusinessAccounts(businessId: string): Promise<Account[]> {
  return apiRequest<BackendAccount[]>(`/api/businesses/${businessId}/accounts`).then((rows) =>
    rows.map(normalizeAccount)
  );
}

export interface BackendOverview {
  balance: string;
  revenue: string;
  expenses: string;
  cash_flow: string;
  currency: BackendCurrency;
  recent_transactions: Array<{
    id: string;
    description: string;
    category: string;
    date: string;
    amount: string;
    currency: BackendCurrency;
    status: "posted" | "pending";
  }>;
}

export function getBusinessOverview(businessId: string) {
  return apiRequest<BackendOverview>(`/api/businesses/${businessId}/overview`);
}
