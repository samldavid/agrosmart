import { Controller, get, type FieldErrors, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/primitives/Button";
import { ChoiceField } from "@/components/forms/ChoiceField";
import { TextField } from "@/components/forms/TextField";
import type { Option } from "@/constants/catalogs";
import { spacing } from "@/theme/tokens";

export type DynamicFieldKind = "text" | "textarea" | "number" | "money" | "date" | "choice" | "email" | "password";

export interface DynamicField<TValues extends FieldValues> {
  name: Path<TValues>;
  label: string;
  placeholder?: string;
  helperText?: string;
  kind?: DynamicFieldKind;
  options?: Option[];
}

interface DynamicFormProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  fields: DynamicField<TValues>[];
  onSubmit: (values: TValues) => void;
  submitLabel: string;
  loading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

function fieldError<TValues extends FieldValues>(errors: FieldErrors<TValues>, path: Path<TValues>): string | undefined {
  const error = get(errors, path) as { message?: string } | undefined;
  return error?.message;
}

export function DynamicForm<TValues extends FieldValues>({
  form,
  fields,
  onSubmit,
  submitLabel,
  loading = false,
  secondaryLabel,
  onSecondary
}: DynamicFormProps<TValues>) {
  return (
    <View style={styles.wrap}>
      {fields.map((fieldConfig) => (
        <Controller
          key={fieldConfig.name}
          control={form.control}
          name={fieldConfig.name}
          render={({ field }) => {
            const kind = fieldConfig.kind ?? "text";
            const error = fieldError(form.formState.errors, fieldConfig.name);

            if (kind === "choice") {
              return (
                <ChoiceField
                  label={fieldConfig.label}
                  value={String(field.value ?? "")}
                  options={fieldConfig.options ?? []}
                  onChange={field.onChange}
                  error={error}
                />
              );
            }

            return (
              <TextField
                label={fieldConfig.label}
                placeholder={fieldConfig.placeholder}
                helperText={fieldConfig.helperText}
                value={field.value === null || field.value === undefined ? "" : String(field.value)}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={error}
                secureTextEntry={kind === "password"}
                keyboardType={kind === "number" || kind === "money" ? "numeric" : kind === "email" ? "email-address" : "default"}
                autoCapitalize={kind === "email" ? "none" : "sentences"}
                multiline={kind === "textarea"}
                numberOfLines={kind === "textarea" ? 4 : 1}
                textContentType={kind === "password" ? "password" : kind === "email" ? "emailAddress" : "none"}
              />
            );
          }}
        />
      ))}
      <View style={styles.actions}>
        <Button title={submitLabel} onPress={form.handleSubmit(onSubmit)} loading={loading} fullWidth />
        {secondaryLabel && onSecondary ? <Button title={secondaryLabel} onPress={onSecondary} variant="ghost" fullWidth /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  actions: {
    gap: spacing.sm
  }
});
