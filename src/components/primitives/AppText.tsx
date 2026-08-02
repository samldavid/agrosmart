import type { PropsWithChildren } from "react";
import { Text, type TextProps, StyleSheet } from "react-native";

import { colors, fontSize, typography } from "@/theme/tokens";

type TextVariant = "display" | "title" | "subtitle" | "body" | "bodyMedium" | "caption" | "label";

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function AppText({
  children,
  variant = "body",
  color = colors.text,
  style,
  ...props
}: PropsWithChildren<AppTextProps>) {
  return (
    <Text {...props} style={[styles.base, styles[variant], { color }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.body,
    letterSpacing: 0
  },
  display: {
    fontFamily: typography.brand,
    fontSize: fontSize.display,
    lineHeight: 42
  },
  title: {
    fontFamily: typography.title,
    fontSize: fontSize.xxl,
    lineHeight: 34
  },
  subtitle: {
    fontFamily: typography.bodyBold,
    fontSize: fontSize.lg,
    lineHeight: 24
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 21
  },
  bodyMedium: {
    fontFamily: typography.bodyMedium,
    fontSize: fontSize.md,
    lineHeight: 21
  },
  caption: {
    fontSize: fontSize.sm,
    lineHeight: 18
  },
  label: {
    fontFamily: typography.bodyBold,
    fontSize: fontSize.sm,
    lineHeight: 18
  }
});
