import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { ErrorState, LoadingState, EmptyState } from "@/components/feedback/States";
import { TextField } from "@/components/forms/TextField";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { financeCategories, financialTypeOptions } from "@/constants/catalogs";
import { DynamicForm, type DynamicField } from "@/features/shared/DynamicForm";
import { NoFarmCard } from "@/features/shared/NoFarmCard";
import { downloadTextFile, exportPrintablePdf } from "@/lib/downloads";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";
import { formatCurrency, formatDate, normalizeSearch } from "@/lib/formatters";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { createFinancialMovement, listFinancialMovements } from "@/repositories/finances";
import { listInventoryMovements, listProducts, listAnimals } from "@/repositories/production";
import { listTasks } from "@/repositories/tasks";
import { financialMovementSchema, type FinancialMovementValues } from "@/schemas/forms";
import { colors, spacing } from "@/theme/tokens";
import type { FinancialMovement } from "@/types/domain";

const financeFields: DynamicField<FinancialMovementValues>[] = [
  { name: "type", label: "Tipo", kind: "choice", options: financialTypeOptions },
  {
    name: "category",
    label: "Categoria",
    kind: "choice",
    options: financeCategories.map((category) => ({ label: category, value: category }))
  },
  { name: "description", label: "Descripcion", placeholder: "Ej. Compra de concentrado" },
  { name: "amount", label: "Valor", kind: "money", placeholder: "0" },
  { name: "transaction_date", label: "Fecha", kind: "date", placeholder: "AAAA-MM-DD" },
  {
    name: "related_entity_type",
    label: "Relacionado con",
    kind: "choice",
    options: [
      { label: "Ninguno", value: "none" },
      { label: "Animal", value: "animal" },
      { label: "Producto", value: "product" },
      { label: "Tarea", value: "task" }
    ]
  },
  { name: "related_entity_id", label: "ID relacionado", placeholder: "Opcional" },
  { name: "receipt_url", label: "Comprobante", placeholder: "URL del comprobante o dejalo vacio" }
];

export function FinancesScreen() {
  const { activeFarmId } = useActiveFarm();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["financial_movements", activeFarmId],
    queryFn: () => listFinancialMovements(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });

  const form = useForm<FinancialMovementValues>({
    resolver: formResolver(financialMovementSchema),
    defaultValues: {
      type: "expense",
      category: "otro",
      description: "",
      amount: 0,
      transaction_date: new Date().toISOString().slice(0, 10),
      related_entity_type: "none",
      related_entity_id: "",
      receipt_url: ""
    }
  });

  const mutation = useMutation({
    mutationFn: (values: FinancialMovementValues) => {
      if (!activeFarmId) {
        throw new Error("Selecciona una finca.");
      }
      return createFinancialMovement(activeFarmId, values);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial_movements", activeFarmId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", activeFarmId] })
      ]);
      form.reset();
      setShowForm(false);
    }
  });

  const movements = query.data ?? [];
  const filtered = useMemo(() => {
    const term = normalizeSearch(search);
    if (!term) {
      return movements;
    }
    return movements.filter((movement) => normalizeSearch(`${movement.description} ${movement.category} ${movement.type}`).includes(term));
  }, [movements, search]);
  const totals = useMemo(() => summarizeFinances(filtered), [filtered]);

  if (!activeFarmId) {
    return (
      <Screen title="Finanzas" subtitle="Registro administrativo de ingresos y gastos.">
        <NoFarmCard />
      </Screen>
    );
  }

  return (
    <Screen title="Finanzas basicas" subtitle="Registra ingresos y gastos administrativos en pesos colombianos.">
      <Card style={styles.warningCard}>
        <AppText variant="bodyMedium" color={colors.warning}>
          Estos valores son registros administrativos y no reemplazan asesoria contable.
        </AppText>
      </Card>
      <View style={styles.summaryRow}>
        <SummaryCard label="Ingresos" value={formatCurrency(totals.income)} color={colors.success} />
        <SummaryCard label="Gastos" value={formatCurrency(totals.expense)} color={colors.error} />
        <SummaryCard label="Balance simple" value={formatCurrency(totals.income - totals.expense)} color={colors.text} />
      </View>
      <View style={styles.toolbar}>
        <TextField label="Buscar" placeholder="Descripcion, categoria o tipo" value={search} onChangeText={setSearch} />
        <Button title="Nuevo registro" icon={<Plus color={colors.white} size={18} />} onPress={() => setShowForm(true)} />
      </View>
      {showForm ? (
        <Card style={styles.wrap}>
          <AppText variant="subtitle">Registrar ingreso o gasto</AppText>
          <DynamicForm
            form={form}
            fields={financeFields}
            onSubmit={(values) => mutation.mutate(values)}
            submitLabel="Guardar registro"
            loading={mutation.isPending}
            secondaryLabel="Cancelar"
            onSecondary={() => setShowForm(false)}
          />
          {mutation.isError ? <AppText color={colors.error}>{getErrorMessage(mutation.error)}</AppText> : null}
        </Card>
      ) : null}
      {query.isLoading ? <LoadingState title="Cargando finanzas" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar finanzas" message={getErrorMessage(query.error)} /> : null}
      {!query.isLoading && filtered.length === 0 ? (
        <EmptyState title="Sin movimientos financieros" message="Registra gastos o ingresos de la finca." actionLabel="Nuevo registro" onAction={() => setShowForm(true)} />
      ) : (
        <View style={styles.list}>
          {filtered.map((movement) => (
            <Card key={movement.id} style={styles.movement}>
              <View style={styles.movementText}>
                <AppText variant="subtitle">{movement.description}</AppText>
                <AppText color={colors.mutedText}>
                  {movement.category} · {formatDate(movement.transaction_date)}
                </AppText>
              </View>
              <AppText variant="subtitle" color={movement.type === "income" ? colors.success : colors.error}>
                {movement.type === "income" ? "+" : "-"} {formatCurrency(movement.amount)}
              </AppText>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

export function ReportsScreen() {
  const { activeFarmId, activeFarm } = useActiveFarm();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const productsQuery = useQuery({ queryKey: ["products", activeFarmId], queryFn: () => listProducts(activeFarmId ?? ""), enabled: Boolean(activeFarmId) });
  const animalsQuery = useQuery({ queryKey: ["animals", activeFarmId], queryFn: () => listAnimals(activeFarmId ?? ""), enabled: Boolean(activeFarmId) });
  const movementsQuery = useQuery({ queryKey: ["inventory_movements", activeFarmId], queryFn: () => listInventoryMovements(activeFarmId ?? ""), enabled: Boolean(activeFarmId) });
  const tasksQuery = useQuery({ queryKey: ["tasks", activeFarmId], queryFn: () => listTasks(activeFarmId ?? ""), enabled: Boolean(activeFarmId) });
  const financesQuery = useQuery({ queryKey: ["financial_movements", activeFarmId], queryFn: () => listFinancialMovements(activeFarmId ?? ""), enabled: Boolean(activeFarmId) });

  if (!activeFarmId) {
    return (
      <Screen title="Reportes" subtitle="Consulta y descarga informacion de la finca.">
        <NoFarmCard />
      </Screen>
    );
  }

  const finances = filterByDate(financesQuery.data ?? [], fromDate, toDate, "transaction_date");
  const movements = filterByDate(movementsQuery.data ?? [], fromDate, toDate, "created_at");
  const totals = summarizeFinances(finances);

  async function downloadCsv(): Promise<void> {
    const rows = [
      ["tipo", "fecha", "descripcion", "categoria", "valor"],
      ...finances.map((row) => [row.type, row.transaction_date, row.description, row.category, String(row.amount)])
    ];
    await downloadTextFile("agrosmart-finanzas.csv", rows.map((row) => row.join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  async function printReport(): Promise<void> {
    const html = `
      <html><body style="font-family: Arial; color:#20251C">
      <h1>Reporte AgroSmart</h1>
      <p>Finca: ${activeFarm?.name ?? ""}</p>
      <p>Animales: ${animalsQuery.data?.length ?? 0}</p>
      <p>Productos: ${productsQuery.data?.length ?? 0}</p>
      <p>Movimientos de inventario: ${movements.length}</p>
      <p>Ingresos: ${formatCurrency(totals.income)}</p>
      <p>Gastos: ${formatCurrency(totals.expense)}</p>
      <p>Balance: ${formatCurrency(totals.income - totals.expense)}</p>
      </body></html>`;
    await exportPrintablePdf("agrosmart-reporte.pdf", html);
  }

  return (
    <Screen title="Reportes" subtitle="Visualiza inventario, produccion, tareas y finanzas por fecha.">
      <View style={styles.filters}>
        <TextField label="Desde" placeholder="AAAA-MM-DD" value={fromDate} onChangeText={setFromDate} />
        <TextField label="Hasta" placeholder="AAAA-MM-DD" value={toDate} onChangeText={setToDate} />
      </View>
      <View style={styles.actionRow}>
        <Button title="Descargar CSV" icon={<Download color={colors.white} size={18} />} onPress={() => void downloadCsv()} />
        <Button title="Version imprimible/PDF" variant="secondary" icon={<FileText color={colors.forestDark} size={18} />} onPress={() => void printReport()} />
      </View>
      {productsQuery.isLoading || animalsQuery.isLoading || movementsQuery.isLoading || tasksQuery.isLoading || financesQuery.isLoading ? (
        <LoadingState title="Preparando reportes" />
      ) : null}
      <View style={styles.summaryRow}>
        <SummaryCard label="Animales" value={String(animalsQuery.data?.length ?? 0)} color={colors.text} />
        <SummaryCard label="Productos" value={String(productsQuery.data?.length ?? 0)} color={colors.text} />
        <SummaryCard label="Movimientos" value={String(movements.length)} color={colors.text} />
        <SummaryCard label="Tareas" value={String(tasksQuery.data?.length ?? 0)} color={colors.text} />
      </View>
      <Card style={styles.wrap}>
        <AppText variant="subtitle">Balance simple</AppText>
        <SummaryCard label="Ingresos" value={formatCurrency(totals.income)} color={colors.success} />
        <SummaryCard label="Gastos" value={formatCurrency(totals.expense)} color={colors.error} />
        <SummaryCard label="Balance" value={formatCurrency(totals.income - totals.expense)} color={colors.text} />
      </Card>
      <Card style={styles.wrap}>
        <AppText variant="subtitle">Productos con bajo inventario</AppText>
        {(productsQuery.data ?? []).filter((product) => product.current_stock <= product.minimum_stock).map((product) => (
          <AppText key={product.id}>
            {product.name}: {product.current_stock} {product.unit} disponibles
          </AppText>
        ))}
      </Card>
    </Screen>
  );
}

function summarizeFinances(rows: FinancialMovement[]): { income: number; expense: number } {
  return rows.reduce(
    (totals, row) => {
      if (row.type === "income") {
        totals.income += row.amount;
      } else {
        totals.expense += row.amount;
      }
      return totals;
    },
    { income: 0, expense: 0 }
  );
}

function filterByDate<TRecord, TKey extends keyof TRecord>(
  rows: TRecord[],
  from: string,
  to: string,
  key: TKey
): TRecord[] {
  return rows.filter((row) => {
    const value = String(row[key] ?? "");
    if (from && value < from) {
      return false;
    }
    if (to && value > to) {
      return false;
    }
    return true;
  });
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={styles.summaryCard}>
      <AppText variant="caption" color={colors.mutedText}>
        {label}
      </AppText>
      <AppText variant="subtitle" color={color}>
        {value}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  warningCard: {
    backgroundColor: colors.warningBg
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  summaryCard: {
    minWidth: 170,
    gap: spacing.xs
  },
  toolbar: {
    gap: spacing.sm
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  list: {
    gap: spacing.sm
  },
  movement: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  movementText: {
    flex: 1
  }
});
