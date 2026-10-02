import { AuthGate } from "@/components/auth/AuthGate";
import { WebappTopbar } from "@/components/webapp/WebappTopbar";
import { WebappDesktopBar } from "@/components/webapp/WebappDesktopBar";
import { WebappSidebar } from "@/components/webapp/WebappSidebar";
import { MobileTabBar } from "@/components/webapp/MobileTabBar";
import { AddIncomeProvider } from "@/components/transactions/AddIncomeContext";

/**
 * RIVA Web authenticated shell. Reuses RIVA's providers (theme, i18n, auth,
 * business, toast) from the root layout and its own AuthGate.
 *
 * RIVA Web maintains its Liquid Glass identity across all screen sizes:
 *  · Mobile → floating glass topbar + bottom tab bar (5 items, RIVA AI centered)
 *  · Tablet/Desktop → floating glass sidebar + floating utility bar
 *  · At NO breakpoint does RIVA Web become RIVA Main
 *
 * The desktop shell uses translucent floating surfaces with backdrop blur,
 * soft borders, subtle shadows, and refined spacing — unmistakably RIVA Web.
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AddIncomeProvider>
        <div className="min-h-screen bg-paper font-sans text-ink antialiased md:h-screen">
          <div className="flex min-h-screen md:h-screen md:overflow-hidden">
            <WebappSidebar />
            <div className="flex min-w-0 flex-1 flex-col md:min-h-0">
              <WebappDesktopBar />
              <main className="min-w-0 flex-1 pb-36 pt-[4.5rem] md:overflow-y-auto md:pb-10 md:pt-[4.5rem]">
                {children}
              </main>
            </div>
          </div>
          <WebappTopbar />
          <MobileTabBar />
        </div>
      </AddIncomeProvider>
    </AuthGate>
  );
}