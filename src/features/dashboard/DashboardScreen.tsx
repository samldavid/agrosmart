import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Bell, Coins, HelpCircle, ListTodo, PawPrint, Sprout, TriangleAlert } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { ErrorState, LoadingState } from "@/components/feedback/States";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/primitives/AppText";
import { Card } from "@/components/primitives/Card";
import { FarmSelector } from "@/features/shared/FarmSelector";
import { NoFarmCard } from "@/features/shared/NoFarmCard";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardSummary } from "@/repositories/dashboard";
import { listInventoryMovements } from "@/repositories/production";
import { listReminders, listTasks } from "@/repositories/tasks";
import { colors, spacing } from "@/theme/tokens";

export function DashboardScreen() {
  const { activeFarmId, activeFarm } = useActiveFarm();
  const { profile } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["dashboard", activeFarmId],
    queryFn: () => getDashboardSummary(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });
  const remindersQuery = useQuery({
    queryKey: ["reminders", activeFarmId],
    queryFn: () => listReminders(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks", activeFarmId],
    queryFn: () => listTasks(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });
  const activityQuery = useQuery({
    queryKey: ["inventory_movements", activeFarmId],
    queryFn: () => listInventoryMovements(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });

  if (!activeFarmId) {
    return (
      <Screen title="Inicio" subtitle="Bienvenido a AgroSmart.">
        <NoFarmCard />
      </Screen>
    );
  }

  const summary = summaryQuery.data;
  const upcomingReminders = (remindersQuery.data ?? []).filter((item) => item.status === "pending").slice(0, 4);
  const pendingTasks = (tasksQuery.data ?? []).filter((item) => item.status === "pending" || item.status === "in_progress").slice(0, 4);
  const recentActivity = (activityQuery.data ?? []).slice(0, 5);

  return (
    <Screen
      title={`Hola, ${profile?.full_name?.split(" ")[0] ?? "productor"}`}
      subtitle={activeFarm ? `Resumen de ${activeFarm.name}` : "Resumen de tu finca"}
      action={<FarmSelector />}
    >
      {summaryQuery.isLoading ? <LoadingState title="Cargando panel" /> : null}
      {summaryQuery.isError ? (
        <ErrorState title="No pudimos cargar el panel" message={getErrorMessage(summaryQuery.error)} onAction={() => void summaryQuery.refetch()} />
      ) : null}
      {summary ? (
        <View style={styles.grid}>
          <Metric title="Animales activos" value={summary.activeAnimals} icon={<PawPrint color={colors.forestDark} />} href="/(app)/production/animals" />
          <Metric title="Productos" value={summary.products} icon={<Sprout color={colors.forestDark} />} href="/(app)/production/products" />
          <Metric title="Bajo inventario" value={summary.lowStockProducts} icon={<TriangleAlert color={colors.warning} />} href="/(app)/production/products" />
          <Metric title="Tareas pendientes" value={summary.pendingTasks} icon={<ListTodo color={colors.forestDark} />} href="/(app)/tasks" />
          <Metric title="Recordatorios" value={summary.upcomingReminders} icon={<Bell color={colors.forestDark} />} href="/(app)/reminders" />
          <Metric title="Tickets abiertos" value={summary.openTickets} icon={<HelpCircle color={colors.forestDark} />} href="/(app)/support" />
        </View>
      ) : null}

      {summary ? (
        <Card style={styles.financeCard}>
          <View style={styles.row}>
            <Coins color={colors.forestDark} size={24} />
            <AppText variant="subtitle">Finanzas del mes</AppText>
          </View>
          <View style={styles.financeRow}>
            <View>
              <AppText variant="caption" color={colors.mutedText}>
                Ingresos
              </AppText>
              <AppText variant="subtitle" color={colors.success}>
                {formatCurrency(summary.monthIncome)}
              </AppText>
            </View>
            <View>
              <AppText variant="caption" color={colors.mutedText}>
                Gastos
              </AppText>
              <AppText variant="subtitle" color={colors.error}>
                {formatCurrency(summary.monthExpenses)}
              </AppText>
            </View>
            <View>
              <AppText variant="caption" color={colors.mutedText}>
                Balance
              </AppText>
              <AppText variant="subtitle">{formatCurrency(summary.monthIncome - summary.monthExpenses)}</AppText>
            </View>
          </View>
        </Card>
      ) : null}

      <View style={styles.twoColumns}>
        <Card style={styles.sectionCard}>
          <AppText variant="subtitle">Proximos recordatorios</AppText>
          {upcomingReminders.length === 0 ? (
            <AppText color={colors.mutedText}>No tienes recordatorios pendientes.</AppText>
          ) : (
            upcomingReminders.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <AppText variant="bodyMedium">{item.title}</AppText>
                <AppText variant="caption" color={colors.mutedText}>
                  {item.category} · {formatDate(item.reminder_date)}
                </AppText>
              </View>
            ))
          )}
        </Card>
        <Card style={styles.sectionCard}>
          <AppText variant="subtitle">Tareas activas</AppText>
          {pendingTasks.length === 0 ? (
            <AppText color={colors.mutedText}>No hay tareas pendientes.</AppText>
          ) : (
            pendingTasks.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/(app)/tasks/${item.id}`)} style={styles.listItem}>
                <AppText variant="bodyMedium">{item.title}</AppText>
                <AppText variant="caption" color={colors.mutedText}>
                  {item.category} · {formatDate(item.due_date)}
                </AppText>
              </Pressable>
            ))
          )}
        </Card>
      </View>

      <Card style={styles.sectionCard}>
        <AppText variant="subtitle">Actividad reciente</AppText>
        {recentActivity.length === 0 ? (
          <AppText color={colors.mutedText}>Los movimientos de inventario apareceran aqui.</AppText>
        ) : (
          recentActivity.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <AppText variant="bodyMedium">{item.reason}</AppText>
              <AppText variant="caption" color={colors.mutedText}>
                {item.movement_type} · {item.quantity} {item.unit} · {formatDate(item.created_at)}
              </AppText>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function Metric({ title, value, icon, href }: { title: string; value: number; icon: React.ReactNode; href: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)}>
      <Card style={styles.metric}>
        <View style={styles.row}>{icon}</View>
        <AppText variant="title">{String(value)}</AppText>
        <AppText color={colors.mutedText}>{title}</AppText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  metric: {
    width: 180,
    minHeight: 132,
    gap: spacing.xs
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  financeCard: {
    gap: spacing.md
  },
  financeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  twoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  sectionCard: {
    flex: 1,
    minWidth: 280,
    gap: spacing.sm
  },
  listItem: {
    gap: spacing.xxs,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: spacing.sm
  }
});
