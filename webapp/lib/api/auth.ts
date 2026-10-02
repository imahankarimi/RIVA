import { apiRequest } from "./client";
import type { BackendCurrency } from "@/lib/currency";

export interface AuthBusiness {
  id: string;
  name: string;
  language: "en" | "fa";
  base_currency: BackendCurrency;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
  business: AuthBusiness;
}

export interface CurrentUserResponse extends AuthUser {
  business: AuthBusiness;
  businesses: Array<{
    id: string;
    name: string;
    language: "en" | "fa";
    base_currency: BackendCurrency;
    is_current: boolean;
  }>;
}

export function signup(email: string, password: string, businessName: string, baseCurrency: BackendCurrency) {
  return apiRequest<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: { email, password, business_name: businessName, base_currency: baseCurrency },
  });
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", { method: "POST", body: { email, password } });
}

export function getCurrentUser(token: string) {
  return apiRequest<CurrentUserResponse>("/api/auth/me", { token });
}

export function updateProfile(firstName: string, lastName: string) {
  return apiRequest<CurrentUserResponse>("/api/auth/me/profile", {
    method: "PATCH",
    body: { first_name: firstName, last_name: lastName },
  });
}
