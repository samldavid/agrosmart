import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import type { ZodType } from "zod";

import { ErrorState, LoadingState, EmptyState } from "@/components/feedback/States";
import { Card } from "@/components/primitives/Card";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/forms/TextField";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { colors, spacing } from "@/theme/tokens";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";
import { normalizeSearch } from "@/lib/formatters";

import { DynamicForm, type DynamicField } from "./DynamicForm";
import { NoFarmCard } from "./NoFarmCard";

export interface ListItemView {
  title: string;
  subtitle: string;
  meta?: string;
  badge?: string;
  tone?: "success" | "warning" | "error" | "info" | "neutral";
}

export interface CrudScreenConfig<TValues extends FieldValues, TRecord> {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyMessage: string;
  queryKey: string;
  fields: DynamicField<TValues>[];
  schema: ZodType<TValues>;
  defaultValues: TValues;
  list: (farmId: string) => Promise<TRecord[]>;
  create: (farmId: string, values: TValues) => Promise<TRecord>;
  update?: (id: string, values: Partial<TValues>) => Promise<TRecord>;
  getId: (record: TRecord) => string;
  toItem: (record: TRecord) => ListItemView;
  toFormValues?: (record: TRecord) => TValues;
  searchableText: (record: TRecord) => string;
  onOpenDetail?: (record: TRecord) => void;
}

interface CrudScreenProps<TValues extends FieldValues, TRecord> {
  config: CrudScreenConfig<TValues, TRecord>;
}

export function CrudScreen<TValues extends FieldValues, TRecord>({ config }: CrudScreenProps<TValues, TRecord>) {
  const queryClient = useQueryClient();
  const { activeFarmId } = useActiveFarm();
  const [isFormVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<TRecord | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm<TValues>({
    resolver: formResolver(config.schema),
    defaultValues: config.defaultValues as DefaultValues<TValues>
  });

  const query = useQuery({
    queryKey: [config.queryKey, activeFarmId],
    queryFn: () => config.list(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });

  const mutation = useMutation({
    mutationFn: (values: TValues) => {
      if (!activeFarmId) {
        throw new Error("Selecciona una finca.");
      }
      if (editing && config.update) {
        return config.update(config.getId(editing), values);
      }
      return config.create(activeFarmId, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [config.queryKey, activeFarmId] });
      form.reset(config.defaultValues);
      setEditing(null);
      setFormVisible(false);
    }
  });

  const records = query.data ?? [];
  const filtered = useMemo(() => {
    const term = normalizeSearch(search);
    if (!term) {
      return records;
    }
    return records.filter((record) => normalizeSearch(config.searchableText(record)).includes(term));
  }, [config, records, search]);

  function openCreate(): void {
    form.reset(config.defaultValues);
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(record: TRecord): void {
    if (!config.update || !config.toFormValues) {
      config.onOpenDetail?.(record);
      return;
    }
    form.reset(config.toFormValues(record));
    setEditing(record);
    setFormVisible(true);
  }

  if (!activeFarmId) {
    return <NoFarmCard />;
  }

  if (query.isLoading) {
    return <LoadingState title="Cargando registros" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="No pudimos cargar la informacion"
        message={getErrorMessage(query.error)}
        onAction={() => void query.refetch()}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Search color={colors.mutedText} size={18} />
          <TextField label="Buscar" placeholder="Busca por nombre, estado o categoria" value={search} onChangeText={setSearch} />
        </View>
        <Button title="Nuevo" onPress={openCreate} icon={<Plus color={colors.white} size={18} />} />
      </View>

      {isFormVisible ? (
        <Card>
          <AppText variant="subtitle">{editing ? "Editar registro" : "Nuevo registro"}</AppText>
          <DynamicForm
            form={form}
            fields={config.fields}
            onSubmit={(values) => mutation.mutate(values)}
            submitLabel={editing ? "Guardar cambios" : "Guardar"}
            loading={mutation.isPending}
            secondaryLabel="Cancelar"
            onSecondary={() => {
              setFormVisible(false);
              setEditing(null);
              form.reset(config.defaultValues);
            }}
          />
          {mutation.isError ? (
            <AppText color={colors.error} variant="caption">
              {getErrorMessage(mutation.error)}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title={config.emptyTitle} message={config.emptyMessage} actionLabel="Crear registro" onAction={openCreate} />
      ) : (
        <View style={styles.list}>
          {filtered.map((record) => {
            const item = config.toItem(record);
            const canEdit = Boolean(config.update && config.toFormValues);
            return (
              <Pressable
                key={config.getId(record)}
                accessibilityRole="button"
                onPress={() => {
                  if (config.onOpenDetail) {
                    config.onOpenDetail(record);
                  } else {
                    openEdit(record);
                  }
                }}
                style={styles.itemPressable}
              >
                <Card style={styles.item}>
                  <View style={styles.itemMain}>
                    <AppText variant="subtitle">{item.title}</AppText>
                    <AppText color={colors.mutedText}>{item.subtitle}</AppText>
                    {item.meta ? <AppText variant="caption">{item.meta}</AppText> : null}
                  </View>
                  {item.badge ? (
                    <View style={styles.badge}>
                      <AppText variant="caption" color={colors.forestDark}>
                        {item.badge}
                      </AppText>
                    </View>
                  ) : null}
                  {canEdit ? <Button title="Editar" variant="ghost" onPress={() => openEdit(record)} /> : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  toolbar: {
    gap: spacing.sm
  },
  searchWrap: {
    gap: spacing.xs
  },
  list: {
    gap: spacing.sm
  },
  itemPressable: {
    width: "100%"
  },
  item: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    justifyContent: "space-between"
  },
  itemMain: {
    flex: 1,
    gap: spacing.xxs
  },
  badge: {
    backgroundColor: colors.cream,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs
  }
});
