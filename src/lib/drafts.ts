import AsyncStorage from "@react-native-async-storage/async-storage";

const prefix = "agrosmart:draft:";

export async function saveDraft<TValue>(key: string, value: TValue): Promise<void> {
  await AsyncStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
}

export async function loadDraft<TValue>(key: string): Promise<TValue | null> {
  const raw = await AsyncStorage.getItem(`${prefix}${key}`);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as TValue;
}

export async function clearDraft(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${prefix}${key}`);
}
