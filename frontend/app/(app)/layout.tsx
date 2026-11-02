"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileSetupModal } from "@/components/settings/ProfileSetupModal";
import { AddIncomeProvider } from "@/components/transactions/AddIncomeContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <SidebarProvider>
        <AddIncomeProvider>
          <div className="flex h-screen overflow-hidden bg-paper">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {/*
                Bottom padding clears the FLOATING navigation bar rather than a
                static one. The bar is ~64px tall and floats
                `max(env(safe-area-inset-bottom), 12px)` above the bottom edge,
                so 80px + the safe area guarantees the last row of a list is
                never hidden behind it. Desktop (`lg`) has a sidebar, not a bar,
                so it needs no padding.
              */}
              <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+80px)] lg:pb-0">
                {children}
              </main>
            </div>
            <MobileNav />
            <MobileNavDrawer />
          </div>
          <ProfileSetupModal />
        </AddIncomeProvider>
      </SidebarProvider>
    </AuthGate>
  );
}
