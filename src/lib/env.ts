import Constants from "expo-constants";

declare const process: {
  env: Record<string, string | undefined>;
};

const extra = Constants.expoConfig?.extra ?? {};

function readEnv(key: string): string | undefined {
  const fromProcess =
    key === "EXPO_PUBLIC_SUPABASE_URL"
      ? process.env.EXPO_PUBLIC_SUPABASE_URL
      : key === "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        ? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        : key === "EXPO_PUBLIC_SUPABASE_ANON_KEY"
          ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
          : key === "EXPO_PUBLIC_APP_TIME_ZONE"
            ? process.env.EXPO_PUBLIC_APP_TIME_ZONE
            : key === "EXPO_PUBLIC_APP_LOCALE"
              ? process.env.EXPO_PUBLIC_APP_LOCALE
              : undefined;
  const fromExpo = extra[key];
  return typeof fromProcess === "string" ? fromProcess : typeof fromExpo === "string" ? fromExpo : undefined;
}

export const env = {
  supabaseUrl: readEnv("EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey:
    readEnv("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  locale: readEnv("EXPO_PUBLIC_APP_LOCALE") ?? "es-CO",
  timeZone: readEnv("EXPO_PUBLIC_APP_TIME_ZONE") ?? "America/Bogota"
};

export const isSupabaseConfigured =
  Boolean(env.supabaseUrl?.startsWith("https://")) &&
  Boolean(env.supabaseAnonKey) &&
  env.supabaseAnonKey !== "your-public-anon-key" &&
  env.supabaseAnonKey !== "your-public-publishable-key";
