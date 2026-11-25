import { AuthScreen } from "@/components/auth/AuthScreen";

/**
 * RIVA Web — explicit sign-in route.
 *
 * The guest experience keeps the app shell mounted and offers contextual
 * authentication in a bottom sheet, so a visitor normally never needs this
 * URL. It remains available for direct links and for flows that prefer a
 * full-page sign-in. After success it continues to the remembered route (or
 * `/home`). Keep it in sync with `frontend/app/login/page.tsx`.
 */
export default function LoginPage() {
  return <AuthScreen />;
}