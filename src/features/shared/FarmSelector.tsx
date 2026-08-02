import { Pressable, StyleSheet, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { AppText } from "@/components/primitives/AppText";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { colors, radius, spacing } from "@/theme/tokens";

export function FarmSelector() {
  const { farms, activeFarm, activeFarmId, setActiveFarmId } = useActiveFarm();

  if (farms.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="caption" color={colors.warning}>
          Sin finca activa
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.wrap} accessibilityLabel="Selector de finca activa">
      <View style={styles.current}>
        <AppText variant="caption" color={colors.mutedText}>
          Finca activa
        </AppText>
        <AppText variant="bodyMedium">{activeFarm?.name ?? "Selecciona una finca"}</AppText>
        <ChevronDown color={colors.forest} size={16} />
      </View>
      <View style={styles.options}>
        {farms.map((farm) => (
          <Pressable
            key={farm.id}
            onPress={() => void setActiveFarmId(farm.id)}
            style={[styles.option, activeFarmId === farm.id ? styles.optionActive : null]}
          >
            <AppText variant="caption" color={activeFarmId === farm.id ? colors.white : colors.text}>
              {farm.name}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs
  },
  current: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  option: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs
  },
  optionActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest
  },
  empty: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.sm
  }
});
