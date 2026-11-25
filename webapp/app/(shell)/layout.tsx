import { WebappShell } from "@/components/webapp/WebappShell";

/**
 * RIVA Web shell.
 *
 * The real application chrome (Liquid Glass topbar, sidebar, floating tab bar)
 * is shared by authenticated and guest states — see `WebappShell`. There is no
 * separate guest application.
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <WebappShell>{children}</WebappShell>;
}
