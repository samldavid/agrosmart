import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/primitives/AppText";
import type { Option } from "@/constants/catalogs";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface ChoiceFieldProps<TValue extends string> {
  label: string;
  value: TValue;
  options: Option<TValue>[];
  onChange: (value: TValue) => void;
  error?: string | undefined;
}

export function ChoiceField<TValue extends string>({
  label,
  value,
  options,
  onChange,
  error
}: ChoiceFieldProps<TValue>) {
  return (
    <View style={styles.group}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.option, selected ? styles.selected : null]}
            >
              <AppText style={[styles.optionText, selected ? styles.selectedText : null]}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  option: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  selected: {
    backgroundColor: colors.forestDark,
    borderColor: colors.forestDark
  },
  optionText: {
    fontFamily: typography.bodyMedium
  },
  selectedText: {
    color: colors.white
  }
});
