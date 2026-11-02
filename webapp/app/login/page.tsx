import { AuthScreen } from "@/components/auth/AuthScreen";

/**
 * RIVA Web — explicit sign-in route.
 *
 * `AuthScreen` is normally rendered in place by `AuthGate` inside the
 * `(shell)` layout, so an unauthenticated visitor never actually needs this
 * URL. It exists because the logout handlers in `WebappSidebar`,
 * `WebappSettingsModal` and `app/(shell)/settings/page.tsx` all navigate to
 * `/login` after clearing the token — without this route those redirects land
 * on a 404. Keep it in sync with `frontend/app/login/page.tsx`.
 */
export default function LoginPage() {
  return <AuthScreen />;
}