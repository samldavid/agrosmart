import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60,
      retry: 2,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1
    }
  }
});
