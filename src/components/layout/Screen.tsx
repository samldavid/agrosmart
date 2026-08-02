import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/primitives/AppText";
import { colors, layout, spacing } from "@/theme/tokens";

interface ScreenProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({
  title,
  subtitle,
  action,
  scroll = true,
  contentStyle,
  children
}: PropsWithChildren<ScreenProps>) {
  const content = (
    <View style={[styles.inner, contentStyle]}>
      {(title || subtitle || action) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <AppText variant="title">{title}</AppText> : null}
            {subtitle ? (
              <AppText variant="body" color={colors.mutedText}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream
  },
  scroll: {
    flexGrow: 1
  },
  inner: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.md,
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md
  },
  headerText: {
    flex: 1,
    gap: spacing.xs
  }
});
