import { Redirect, Slot } from "expo-router";

import { AppShell } from "@/components/layout/AppShell";
import { AuthLoading } from "@/features/auth/AuthScreens";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminLayout() {
  const { loading, session, isAdmin, profile } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!isAdmin && profile?.role !== "support") {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
