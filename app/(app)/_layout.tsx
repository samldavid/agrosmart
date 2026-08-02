import { Redirect, Slot } from "expo-router";

import { AppShell } from "@/components/layout/AppShell";
import { AuthLoading, BlockedAccountScreen } from "@/features/auth/AuthScreens";
import { useAuth } from "@/providers/AuthProvider";

export default function ProtectedAppLayout() {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (profile?.status === "blocked") {
    return <BlockedAccountScreen />;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
