import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme/tokens";

export function SkeletonList() {
  return (
    <View style={styles.wrap} accessibilityLabel="Cargando contenido">
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.lineWide} />
          <View style={styles.lineShort} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm
  },
  item: {
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md
  },
  lineWide: {
    height: 16,
    width: "70%",
    borderRadius: radius.sm,
    backgroundColor: colors.line
  },
  lineShort: {
    height: 12,
    width: "45%",
    borderRadius: radius.sm,
    backgroundColor: colors.cream
  }
});
