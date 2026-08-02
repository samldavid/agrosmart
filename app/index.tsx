import { Redirect } from "expo-router";

import { AuthLoading, BlockedAccountScreen, MissingConfigurationScreen } from "@/features/auth/AuthScreens";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function IndexRoute() {
  const { isConfigured, loading, session, profile, isAdmin } = useAuth();
  const { farms, loading: farmsLoading } = useActiveFarm();

  if (!isConfigured) {
    return <MissingConfigurationScreen />;
  }

  if (loading || (session && farmsLoading)) {
    return <AuthLoading />;
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (profile?.status === "blocked") {
    return <BlockedAccountScreen />;
  }

  if (!profile?.full_name) {
    return <Redirect href="/(onboarding)/profile" />;
  }

  if (isAdmin) {
    return <Redirect href="/admin" />;
  }

  if (farms.length === 0) {
    return <Redirect href="/(onboarding)/farm" />;
  }

  return <Redirect href="/(app)/dashboard" />;
}
