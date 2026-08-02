import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function downloadTextFile(filename: string, content: string, mimeType: string): Promise<string> {
  const sanitized = safeFilename(filename);

  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = sanitized;
    link.click();
    URL.revokeObjectURL(url);
    return sanitized;
  }

  const directory = FileSystem.documentDirectory;
  if (!directory) {
    throw new Error("No hay un directorio local disponible para guardar el archivo.");
  }

  const uri = `${directory}${sanitized}`;
  await FileSystem.writeAsStringAsync(uri, content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType });
  }
  return uri;
}

export async function exportPrintablePdf(filename: string, html: string): Promise<string> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const popup = window.open("", "_blank");
    if (!popup) {
      throw new Error("Permite ventanas emergentes para abrir la version imprimible.");
    }
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    return filename;
  }

  const result = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
  }
  return result.uri;
}
