import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AlertCircle, Inbox, WifiOff } from "lucide-react-native";

import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { colors, spacing } from "@/theme/tokens";

interface StateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LoadingState({ title = "Cargando informacion" }: Partial<StateProps>) {
  return (
    <Card style={styles.state}>
      <ActivityIndicator color={colors.forestDark} />
      <AppText variant="bodyMedium">{title}</AppText>
    </Card>
  );
}

export function ErrorState({ title, message, actionLabel = "Intentar de nuevo", onAction }: StateProps) {
  return (
    <Card style={styles.state}>
      <AlertCircle color={colors.error} size={28} />
      <AppText variant="subtitle">{title}</AppText>
      {message ? (
        <AppText color={colors.mutedText} style={styles.centerText}>
          {message}
        </AppText>
      ) : null}
      {onAction ? <Button title={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </Card>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: StateProps) {
  return (
    <Card style={styles.state}>
      <Inbox color={colors.olive} size={30} />
      <AppText variant="subtitle">{title}</AppText>
      {message ? (
        <AppText color={colors.mutedText} style={styles.centerText}>
          {message}
        </AppText>
      ) : null}
      {onAction && actionLabel ? <Button title={actionLabel} onPress={onAction} /> : null}
    </Card>
  );
}

export function OfflineState() {
  return (
    <View style={styles.offline}>
      <WifiOff color={colors.warning} size={18} />
      <AppText variant="caption" color={colors.warning}>
        Sin conexion. Veras informacion en cache y guardaremos borradores locales.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg
  },
  centerText: {
    textAlign: "center"
  },
  offline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.warningBg,
    borderColor: colors.beige,
    borderWidth: 1,
    padding: spacing.sm
  }
});
