import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/lib/queryClient";

import { ActiveFarmProvider } from "./ActiveFarmProvider";
import { AuthProvider } from "./AuthProvider";
import { ConnectivityProvider } from "./ConnectivityProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <ConnectivityProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ActiveFarmProvider>{children}</ActiveFarmProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>
  );
}
