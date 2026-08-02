import { StyleSheet, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme/tokens";

import { AppText } from "./AppText";

type BadgeTone = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  success: { backgroundColor: "#E8F1E4", color: colors.success },
  warning: { backgroundColor: colors.warningBg, color: colors.warning },
  error: { backgroundColor: colors.errorBg, color: colors.error },
  info: { backgroundColor: colors.infoBg, color: colors.info },
  neutral: { backgroundColor: colors.cream, color: colors.mutedText }
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const toneStyle = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }]}>
      <AppText style={[styles.text, { color: toneStyle.color }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs
  },
  text: {
    fontFamily: typography.bodyBold,
    fontSize: 11
  }
});
