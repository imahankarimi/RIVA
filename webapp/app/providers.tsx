"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { PreferencesProvider } from "@/lib/preferences/PreferencesProvider";
import {
  getCurrentUser,
  login as loginRequest,
  signup as signupRequest,
  updateProfile as updateProfileRequest,
  type AuthResponse,
  type CurrentUserResponse,
} from "@/lib/api/auth";
import {
  createBusiness as createBusinessRequest,
  deleteBusiness as deleteBusinessRequest,
  updateBusiness as updateBusinessRequest,
  switchBusiness as switchBusinessRequest,
} from "@/lib/api/businesses";
import { getStoredToken, setStoredToken, clearStoredToken } from "@/lib/api/client";
import { ToastProvider } from "@/components/ui/Toast";
import type { Business } from "@/lib/types";
import type { BackendCurrency } from "@/lib/currency";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUserProfile | null;
  business: Business | null;
  businesses: Business[];
  /** True once logged in but first/last name haven't been set yet — drives the first-run profile modal. */
  needsProfileSetup: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (email: string, password: string, businessName: string, baseCurrency: BackendCurrency) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  switchBusiness: (businessId: string) => Promise<void>;
  addBusiness: (name: string, currency: BackendCurrency) => Promise<Business>;
  removeBusiness: (businessId: string) => Promise<void>;
  updateCurrentBusiness: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toBusiness(
  b: { id: string; name: string; base_currency: BackendCurrency },
  currentId?: string
): Business {
  return {
    id: b.id,
    name: b.name,
    currency: b.base_currency,
    isCurrent: currentId ? b.id === currentId : undefined,
  };
}

function toUser(u: { id: string; email: string; first_name: string | null; last_name: string | null }): AuthUserProfile {
  return { id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name };
}

function applyCurrentUserResponse(response: CurrentUserResponse) {
  const business = toBusiness(response.business, response.business.id);
  const businesses = response.businesses.map((b) => ({
    id: b.id,
    name: b.name,
    currency: b.base_currency,
    isCurrent: b.is_current,
  }));
  return { user: toUser(response), business, businesses };
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const clear = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setBusiness(null);
    setBusinesses([]);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    getCurrentUser(token)
      .then((response) => {
        const applied = applyCurrentUserResponse(response);
        setUser(applied.user);
        setBusiness(applied.business);
        setBusinesses(applied.businesses);
        setStatus("authenticated");
      })
      .catch(clear);
  }, [clear]);

  const applyAuthResponse = useCallback((response: AuthResponse) => {
    setStoredToken(response.access_token);
    setUser(toUser(response.user));
    setBusiness(toBusiness(response.business, response.business.id));
    setBusinesses([toBusiness(response.business, response.business.id)]);
    setStatus("authenticated");
    return response;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      business,
      businesses,
      needsProfileSetup: status === "authenticated" && !!user && (!user.firstName || !user.lastName),
      login: async (email, password) => {
        return applyAuthResponse(await loginRequest(email, password));
      },
      signup: async (email, password, businessName, baseCurrency) => {
        return applyAuthResponse(await signupRequest(email, password, businessName, baseCurrency));
      },
      logout: clear,
      updateProfile: async (firstName, lastName) => {
        const response = await updateProfileRequest(firstName, lastName);
        const applied = applyCurrentUserResponse(response);
        setUser(applied.user);
        setBusiness(applied.business);
        setBusinesses(applied.businesses);
      },
      switchBusiness: async (businessId) => {
        const response = await switchBusinessRequest(businessId);
        const applied = applyCurrentUserResponse(response);
        setUser(applied.user);
        setBusiness(applied.business);
        setBusinesses(applied.businesses);
      },
      addBusiness: async (name, currency) => {
        const created = await createBusinessRequest(name, currency);
        setBusiness(created);
        setBusinesses((prev) => [...prev.map((b) => ({ ...b, isCurrent: false })), created]);
        return created;
      },
      removeBusiness: async (businessId) => {
        await deleteBusinessRequest(businessId);
        // Deleting the current business reassigns the active one server-side —
        // re-sync from the server rather than guess at the new state locally.
        const token = getStoredToken();
        if (token) {
          const response = await getCurrentUser(token);
          const applied = applyCurrentUserResponse(response);
          setUser(applied.user);
          setBusiness(applied.business);
          setBusinesses(applied.businesses);
        }
      },
      updateCurrentBusiness: async (name) => {
        if (!business) return;
        const updated = await updateBusinessRequest(business.id, { name });
        setBusiness({ ...updated, isCurrent: true });
        setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? { ...updated, isCurrent: true } : b)));
      },
    }),
    [status, user, business, businesses, clear, applyAuthResponse]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

interface BusinessContextValue {
  business: Business;
  businesses: Business[];
  setBusinessId: (id: string) => void;
  addBusiness: (name: string, currency: BackendCurrency) => Promise<Business>;
  removeBusiness: (businessId: string) => Promise<void>;
  updateCurrentBusiness: (name: string) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { business, businesses, switchBusiness, addBusiness, removeBusiness, updateCurrentBusiness } = useAuth();

  const value = useMemo<BusinessContextValue>(
    () => ({
      business: business as Business,
      businesses,
      setBusinessId: (id: string) => {
        void switchBusiness(id);
      },
      addBusiness,
      removeBusiness,
      updateCurrentBusiness,
    }),
    [business, businesses, switchBusiness, addBusiness, removeBusiness, updateCurrentBusiness]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <I18nProvider>
          <AuthProvider>
            <BusinessProvider>
              <ToastProvider>{children}</ToastProvider>
            </BusinessProvider>
          </AuthProvider>
        </I18nProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
