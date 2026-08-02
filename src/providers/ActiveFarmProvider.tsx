import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { listFarms } from "@/repositories/farms";
import type { Farm } from "@/types/domain";

import { useAuth } from "./AuthProvider";

const storageKey = "agrosmart:active-farm";

interface ActiveFarmContextValue {
  farms: Farm[];
  activeFarm: Farm | null;
  activeFarmId: string | null;
  loading: boolean;
  setActiveFarmId: (farmId: string) => Promise<void>;
}

const ActiveFarmContext = createContext<ActiveFarmContextValue | undefined>(undefined);

export function ActiveFarmProvider({ children }: PropsWithChildren) {
  const { session, profile } = useAuth();
  const [activeFarmId, setActiveFarmIdState] = useState<string | null>(null);

  const farmsQuery = useQuery({
    queryKey: ["farms", session?.user.id],
    queryFn: listFarms,
    enabled: Boolean(session?.user.id && profile?.status !== "blocked")
  });

  useEffect(() => {
    void AsyncStorage.getItem(storageKey).then(setActiveFarmIdState);
  }, []);

  useEffect(() => {
    const farms = farmsQuery.data ?? [];
    if (farms.length === 0) {
      return;
    }
    const exists = farms.some((farm) => farm.id === activeFarmId);
    if (!activeFarmId || !exists) {
      const firstFarm = farms[0];
      if (firstFarm) {
        void setActiveFarmId(firstFarm.id);
      }
    }
  }, [activeFarmId, farmsQuery.data]);

  async function setActiveFarmId(farmId: string): Promise<void> {
    setActiveFarmIdState(farmId);
    await AsyncStorage.setItem(storageKey, farmId);
  }

  const farms = farmsQuery.data ?? [];
  const activeFarm = farms.find((farm) => farm.id === activeFarmId) ?? null;

  const value = useMemo<ActiveFarmContextValue>(
    () => ({
      farms,
      activeFarm,
      activeFarmId,
      loading: farmsQuery.isLoading,
      setActiveFarmId
    }),
    [activeFarm, activeFarmId, farms, farmsQuery.isLoading]
  );

  return <ActiveFarmContext.Provider value={value}>{children}</ActiveFarmContext.Provider>;
}

export function useActiveFarm(): ActiveFarmContextValue {
  const context = useContext(ActiveFarmContext);
  if (!context) {
    throw new Error("useActiveFarm debe usarse dentro de ActiveFarmProvider.");
  }
  return context;
}
