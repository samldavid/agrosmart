import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { toAppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";

export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.72,
    allowsEditing: true
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
}

export async function pickDocument(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: false,
    copyToCacheDirectory: true
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
}

export async function uploadPrivateFile(bucket: string, path: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const { error } = await getSupabase().storage.from(bucket).upload(path, blob, {
    cacheControl: "3600",
    upsert: true
  });

  if (error) {
    throw toAppError(error, "No pudimos subir el archivo.");
  }

  const { data, error: signedError } = await getSupabase().storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signedError) {
    throw toAppError(signedError, "No pudimos generar el enlace seguro del archivo.");
  }
  return data.signedUrl;
}
