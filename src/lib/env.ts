import Constants from "expo-constants";

declare const process: {
  env: Record<string, string | undefined>;
};

const extra = Constants.expoConfig?.extra ?? {};

const processEnvKeys: Record<string, string | undefined> = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_APP_TIME_ZONE: process.env.EXPO_PUBLIC_APP_TIME_ZONE,
  EXPO_PUBLIC_APP_LOCALE: process.env.EXPO_PUBLIC_APP_LOCALE
};

function cleanEnvValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const cleaned = value.replace(/^\uFEFF/, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function readEnv(key: string): string | undefined {
  const fromProcess = processEnvKeys[key];
  const fromExpo = extra[key];
  return cleanEnvValue(fromProcess) ?? cleanEnvValue(fromExpo);
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
