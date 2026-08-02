import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type AccessibilityRole,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { colors, layout, radius, spacing, typography } from "@/theme/tokens";

import { AppText } from "./AppText";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  icon,
  variant = "primary",
  disabled,
  loading = false,
  fullWidth = false,
  style,
  accessibilityRole = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.white : colors.forestDark} /> : icon}
      <AppText
        style={[
          styles.label,
          variant === "primary" || variant === "danger" ? styles.lightText : styles.darkText
        ]}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1
  },
  primary: {
    backgroundColor: colors.forestDark,
    borderColor: colors.forestDark
  },
  secondary: {
    backgroundColor: colors.beige,
    borderColor: colors.border
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  fullWidth: {
    width: "100%"
  },
  label: {
    fontFamily: typography.bodyBold
  },
  lightText: {
    color: colors.white
  },
  darkText: {
    color: colors.text
  }
});
