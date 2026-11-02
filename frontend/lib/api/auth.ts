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
  is_verified: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
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

/** Revoke the server-side session behind the current access token.
 *  Best-effort: callers clear local state regardless of the outcome. */
export function logout() {
  return apiRequest<{ message: string; revoked: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export function updateProfile(firstName: string, lastName: string) {
  return apiRequest<CurrentUserResponse>("/api/auth/me/profile", {
    method: "PATCH",
    body: { first_name: firstName, last_name: lastName },
  });
}

export function resendVerification() {
  return apiRequest<{ message: string; expires_hours?: number; already_verified?: boolean }>(
    "/api/auth/resend-verification",
    { method: "POST" }
  );
}

export function verifyEmail(token: string) {
  return apiRequest<{ message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ message: string; expires_hours: number }>(
    "/api/auth/request-password-reset",
    {
      method: "POST",
      body: { email },
    }
  );
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: { token, new_password: newPassword },
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string; sessions_revoked: string }>(
    "/api/auth/change-password",
    {
      method: "POST",
      body: { current_password: currentPassword, new_password: newPassword },
    }
  );
}
