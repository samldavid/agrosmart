import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { AppText } from "@/components/primitives/AppText";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
  helperText?: string | undefined;
}

export function TextField({ label, error, helperText, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.group}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        placeholderTextColor={colors.mutedText}
        style={[styles.input, error ? styles.inputError : null, style]}
        accessibilityLabel={label}
        {...props}
      />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" color={colors.mutedText}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.text,
    fontFamily: typography.body,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg
  }
});
