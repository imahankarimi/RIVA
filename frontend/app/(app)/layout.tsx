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
              <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-16 lg:pb-0">
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
