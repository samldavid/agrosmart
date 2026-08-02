import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Beef, Boxes, Leaf, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";

import { ErrorState, LoadingState, EmptyState } from "@/components/feedback/States";
import { TextField } from "@/components/forms/TextField";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import {
  animalStatusOptions,
  movementTypeOptions,
  productStatusOptions,
  sexOptions
} from "@/constants/catalogs";
import { DynamicForm, type DynamicField } from "@/features/shared/DynamicForm";
import { CrudScreen, type CrudScreenConfig } from "@/features/shared/CrudScreen";
import { NoFarmCard } from "@/features/shared/NoFarmCard";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";
import { formatCurrency, formatDate, normalizeSearch } from "@/lib/formatters";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import {
  createAnimal,
  createProduct,
  getAnimal,
  getProduct,
  listAnimals,
  listInventoryMovements,
  listProducts,
  recordInventoryMovement,
  updateAnimal,
  updateProduct
} from "@/repositories/production";
import {
  animalSchema,
  inventoryMovementSchema,
  productSchema,
  type AnimalValues,
  type InventoryMovementValues,
  type ProductValues
} from "@/schemas/forms";
import { colors, spacing } from "@/theme/tokens";
import type { AgriculturalProduct, Animal, InventoryMovement } from "@/types/domain";

const animalFields: DynamicField<AnimalValues>[] = [
  { name: "identification_code", label: "Codigo o chapeta", placeholder: "Ej. BOV-001" },
  { name: "name", label: "Nombre", placeholder: "Ej. Lucera" },
  { name: "species", label: "Especie", placeholder: "Ej. Bovino" },
  { name: "breed", label: "Raza", placeholder: "Ej. Brahman" },
  { name: "sex", label: "Sexo", kind: "choice", options: sexOptions },
  { name: "birth_date", label: "Fecha de nacimiento", placeholder: "AAAA-MM-DD", kind: "date" },
  { name: "acquisition_date", label: "Fecha de ingreso", placeholder: "AAAA-MM-DD", kind: "date" },
  { name: "weight", label: "Peso", placeholder: "Ej. 420", kind: "number" },
  {
    name: "weight_unit",
    label: "Unidad de peso",
    kind: "choice",
    options: [
      { label: "Kg", value: "kg" },
      { label: "Lb", value: "lb" }
    ]
  },
  { name: "status", label: "Estado", kind: "choice", options: animalStatusOptions },
  { name: "photo_url", label: "Fotografia", placeholder: "URL de foto o dejalo vacio" },
  { name: "notes", label: "Observaciones", placeholder: "Notas importantes", kind: "textarea" }
];

const productFields: DynamicField<ProductValues>[] = [
  { name: "name", label: "Nombre del producto", placeholder: "Ej. Maiz amarillo" },
  { name: "category", label: "Categoria", placeholder: "Ej. Cereal, fruta, insumo" },
  { name: "crop_type", label: "Tipo de cultivo", placeholder: "Ej. Semestral, permanente" },
  { name: "unit", label: "Unidad", placeholder: "Ej. kg, bulto, arroba" },
  { name: "current_stock", label: "Cantidad disponible", kind: "number", placeholder: "0" },
  { name: "minimum_stock", label: "Cantidad minima", kind: "number", placeholder: "0" },
  { name: "unit_cost", label: "Costo unitario", kind: "money", placeholder: "0" },
  { name: "sale_price", label: "Precio de venta", kind: "money", placeholder: "0" },
  { name: "status", label: "Estado", kind: "choice", options: productStatusOptions },
  { name: "image_url", label: "Imagen", placeholder: "URL de imagen o dejalo vacio" },
  { name: "notes", label: "Observaciones", placeholder: "Notas utiles", kind: "textarea" }
];

export function ProductionHubScreen() {
  return (
    <Screen title="Produccion" subtitle="Accede a ganado, productos e inventario de la finca activa.">
      <View style={styles.hubGrid}>
        <HubCard
          title="Ganado"
          text="Registra animales, estados, pesos y observaciones."
          icon={<Beef color={colors.forestDark} size={30} />}
          href="/(app)/production/animals"
        />
        <HubCard
          title="Productos"
          text="Controla cultivos, productos agricolas, precios y stock minimo."
          icon={<Leaf color={colors.forestDark} size={30} />}
          href="/(app)/production/products"
        />
        <HubCard
          title="Inventario"
          text="Registra entradas, salidas, ventas, perdidas y ajustes."
          icon={<Boxes color={colors.forestDark} size={30} />}
          href="/(app)/production/inventory-movements"
        />
      </View>
    </Screen>
  );
}

function HubCard({ title, text, icon, href }: { title: string; text: string; icon: React.ReactNode; href: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)}>
      <Card style={styles.hubCard}>
        {icon}
        <AppText variant="subtitle">{title}</AppText>
        <AppText color={colors.mutedText}>{text}</AppText>
      </Card>
    </Pressable>
  );
}

export function AnimalsScreen() {
  const config: CrudScreenConfig<AnimalValues, Animal> = {
    title: "Ganado",
    subtitle: "Listado, busqueda, registro y cambio de estado de animales.",
    emptyTitle: "Aun no hay animales",
    emptyMessage: "Registra tu primer animal con codigo, especie y estado.",
    queryKey: "animals",
    fields: animalFields,
    schema: animalSchema,
    defaultValues: {
      identification_code: "",
      name: "",
      species: "Bovino",
      breed: "",
      sex: "unknown",
      birth_date: "",
      acquisition_date: "",
      weight: null,
      weight_unit: "kg",
      status: "active",
      photo_url: "",
      notes: ""
    },
    list: listAnimals,
    create: createAnimal,
    update: updateAnimal,
    getId: (record) => record.id,
    toItem: (record) => ({
      title: record.name ? `${record.identification_code} - ${record.name}` : record.identification_code,
      subtitle: `${record.species}${record.breed ? `, ${record.breed}` : ""}`,
      meta: `Peso: ${record.weight ?? "Sin dato"} ${record.weight_unit} · Ingreso: ${formatDate(record.acquisition_date)}`,
      badge: animalStatusOptions.find((option) => option.value === record.status)?.label ?? record.status
    }),
    toFormValues: (record) => ({
      identification_code: record.identification_code,
      name: record.name ?? "",
      species: record.species,
      breed: record.breed ?? "",
      sex: record.sex,
      birth_date: record.birth_date ?? "",
      acquisition_date: record.acquisition_date ?? "",
      weight: record.weight,
      weight_unit: record.weight_unit,
      status: record.status,
      photo_url: record.photo_url ?? "",
      notes: record.notes ?? ""
    }),
    searchableText: (record) => `${record.identification_code} ${record.name ?? ""} ${record.species} ${record.status}`,
    onOpenDetail: (record) => router.push(`/(app)/production/animals/${record.id}`)
  };

  return (
    <Screen title={config.title} subtitle={config.subtitle}>
      <CrudScreen config={config} />
    </Screen>
  );
}

export function ProductsScreen() {
  const config: CrudScreenConfig<ProductValues, AgriculturalProduct> = {
    title: "Productos agricolas",
    subtitle: "Controla cantidades disponibles, costos, precios y alertas de bajo inventario.",
    emptyTitle: "Aun no hay productos",
    emptyMessage: "Registra productos, cultivos o insumos para empezar a controlar inventario.",
    queryKey: "products",
    fields: productFields,
    schema: productSchema,
    defaultValues: {
      name: "",
      category: "",
      crop_type: "",
      unit: "kg",
      current_stock: 0,
      minimum_stock: 0,
      unit_cost: 0,
      sale_price: 0,
      image_url: "",
      status: "active",
      notes: ""
    },
    list: listProducts,
    create: createProduct,
    update: updateProduct,
    getId: (record) => record.id,
    toItem: (record) => ({
      title: record.name,
      subtitle: `${record.category} · ${record.current_stock} ${record.unit} disponibles`,
      meta: `Minimo: ${record.minimum_stock} ${record.unit} · Venta: ${formatCurrency(record.sale_price)}`,
      badge: record.current_stock <= record.minimum_stock ? "Bajo inventario" : "Disponible",
      tone: record.current_stock <= record.minimum_stock ? "warning" : "success"
    }),
    toFormValues: (record) => ({
      name: record.name,
      category: record.category,
      crop_type: record.crop_type ?? "",
      unit: record.unit,
      current_stock: record.current_stock,
      minimum_stock: record.minimum_stock,
      unit_cost: record.unit_cost,
      sale_price: record.sale_price,
      image_url: record.image_url ?? "",
      status: record.status,
      notes: record.notes ?? ""
    }),
    searchableText: (record) => `${record.name} ${record.category} ${record.status}`,
    onOpenDetail: (record) => router.push(`/(app)/production/products/${record.id}`)
  };

  return (
    <Screen title={config.title} subtitle={config.subtitle}>
      <CrudScreen config={config} />
    </Screen>
  );
}

export function InventoryMovementsScreen() {
  const { activeFarmId } = useActiveFarm();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products", activeFarmId],
    queryFn: () => listProducts(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });
  const movementsQuery = useQuery({
    queryKey: ["inventory_movements", activeFarmId],
    queryFn: () => listInventoryMovements(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });

  const productOptions = (productsQuery.data ?? []).map((product) => ({
    label: `${product.name} (${product.current_stock} ${product.unit})`,
    value: product.id
  }));

  const fields: DynamicField<InventoryMovementValues>[] = [
    { name: "product_id", label: "Producto", kind: "choice", options: productOptions },
    { name: "movement_type", label: "Tipo de movimiento", kind: "choice", options: movementTypeOptions },
    { name: "quantity", label: "Cantidad", kind: "number", placeholder: "0" },
    { name: "unit", label: "Unidad", placeholder: "Ej. kg, bulto" },
    { name: "unit_value", label: "Valor unitario", kind: "money", placeholder: "0" },
    { name: "reason", label: "Razon", placeholder: "Ej. Venta en plaza" },
    { name: "notes", label: "Observaciones", kind: "textarea", placeholder: "Notas opcionales" }
  ];

  const form = useForm<InventoryMovementValues>({
    resolver: formResolver(inventoryMovementSchema),
    defaultValues: {
      product_id: productOptions[0]?.value ?? "",
      movement_type: "entry",
      quantity: 1,
      unit: productsQuery.data?.[0]?.unit ?? "kg",
      unit_value: 0,
      reason: "",
      notes: ""
    }
  });

  const mutation = useMutation({
    mutationFn: (values: InventoryMovementValues) => {
      if (!activeFarmId) {
        throw new Error("Selecciona una finca.");
      }
      return recordInventoryMovement(activeFarmId, values);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory_movements", activeFarmId] }),
        queryClient.invalidateQueries({ queryKey: ["products", activeFarmId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", activeFarmId] })
      ]);
      setShowForm(false);
      form.reset();
    }
  });

  const productById = useMemo(
    () => new Map((productsQuery.data ?? []).map((product) => [product.id, product])),
    [productsQuery.data]
  );
  const movements = movementsQuery.data ?? [];
  const filtered = movements.filter((movement) => {
    const product = productById.get(movement.entity_id);
    return normalizeSearch(`${product?.name ?? ""} ${movement.reason} ${movement.movement_type}`).includes(normalizeSearch(search));
  });

  if (!activeFarmId) {
    return (
      <Screen title="Inventario" subtitle="Registra entradas y salidas por finca.">
        <NoFarmCard />
      </Screen>
    );
  }

  return (
    <Screen title="Movimientos de inventario" subtitle="El historial no se sobrescribe; cada entrada o salida queda guardada.">
      <View style={styles.wrap}>
        <View style={styles.toolbar}>
          <TextField label="Buscar" placeholder="Producto, razon o tipo" value={search} onChangeText={setSearch} />
          <Button title="Nuevo movimiento" icon={<Plus color={colors.white} size={18} />} onPress={() => setShowForm(true)} />
        </View>

        {showForm ? (
          <Card style={styles.wrap}>
            <AppText variant="subtitle">Registrar movimiento</AppText>
            {productOptions.length === 0 ? (
              <EmptyState title="Primero registra productos" message="El inventario necesita un producto agricola para asociar el movimiento." />
            ) : (
              <DynamicForm
                form={form}
                fields={fields}
                onSubmit={(values) => mutation.mutate(values)}
                submitLabel="Guardar movimiento"
                secondaryLabel="Cancelar"
                onSecondary={() => setShowForm(false)}
                loading={mutation.isPending}
              />
            )}
            {mutation.isError ? <AppText color={colors.error}>{getErrorMessage(mutation.error)}</AppText> : null}
          </Card>
        ) : null}

        {productsQuery.isLoading || movementsQuery.isLoading ? <LoadingState title="Cargando inventario" /> : null}
        {productsQuery.isError || movementsQuery.isError ? (
          <ErrorState
            title="No pudimos cargar inventario"
            message={getErrorMessage(productsQuery.error ?? movementsQuery.error)}
            onAction={() => {
              void productsQuery.refetch();
              void movementsQuery.refetch();
            }}
          />
        ) : null}
        {!productsQuery.isLoading && !movementsQuery.isLoading && filtered.length === 0 ? (
          <EmptyState title="Sin movimientos" message="Registra una entrada, salida, venta, perdida o ajuste." actionLabel="Nuevo movimiento" onAction={() => setShowForm(true)} />
        ) : (
          <View style={styles.list}>
            {filtered.map((movement) => {
              const product = productById.get(movement.entity_id);
              return (
                <Card key={movement.id} style={styles.wrap}>
                  <AppText variant="subtitle">{product?.name ?? "Producto"}</AppText>
                  <AppText color={colors.mutedText}>
                    {movementTypeOptions.find((option) => option.value === movement.movement_type)?.label ?? movement.movement_type} · {movement.quantity} {movement.unit}
                  </AppText>
                  <AppText variant="caption">
                    {movement.reason} · {formatCurrency(movement.total_value)} · {formatDate(movement.created_at)}
                  </AppText>
                  {movement.notes ? <AppText color={colors.mutedText}>{movement.notes}</AppText> : null}
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

export function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["animal", id], queryFn: () => getAnimal(String(id)), enabled: Boolean(id) });

  return (
    <Screen title="Detalle de animal" subtitle="Informacion basica e historial preparado para novedades.">
      {query.isLoading ? <LoadingState title="Cargando animal" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar el animal" message={getErrorMessage(query.error)} /> : null}
      {query.data ? (
        <Card style={styles.wrap}>
          <AppText variant="title">{query.data.name ?? query.data.identification_code}</AppText>
          <AppText color={colors.mutedText}>{query.data.identification_code}</AppText>
          <DetailLine label="Especie" value={query.data.species} />
          <DetailLine label="Raza" value={query.data.breed ?? "Sin dato"} />
          <DetailLine label="Estado" value={animalStatusOptions.find((option) => option.value === query.data.status)?.label ?? query.data.status} />
          <DetailLine label="Peso" value={`${query.data.weight ?? "Sin dato"} ${query.data.weight_unit}`} />
          <DetailLine label="Nacimiento" value={formatDate(query.data.birth_date)} />
          <DetailLine label="Ingreso" value={formatDate(query.data.acquisition_date)} />
          <DetailLine label="Observaciones" value={query.data.notes ?? "Sin observaciones"} />
        </Card>
      ) : null}
    </Screen>
  );
}

export function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(String(id)), enabled: Boolean(id) });
  const movementsQuery = useQuery({
    queryKey: ["product_movements", id, query.data?.farm_id],
    queryFn: () => listInventoryMovements(query.data?.farm_id ?? "", String(id)),
    enabled: Boolean(id && query.data?.farm_id)
  });

  return (
    <Screen title="Detalle de producto" subtitle="Stock, precios e historial de movimientos.">
      {query.isLoading ? <LoadingState title="Cargando producto" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar el producto" message={getErrorMessage(query.error)} /> : null}
      {query.data ? (
        <View style={styles.wrap}>
          <Card style={styles.wrap}>
            <AppText variant="title">{query.data.name}</AppText>
            <DetailLine label="Categoria" value={query.data.category} />
            <DetailLine label="Cantidad disponible" value={`${query.data.current_stock} ${query.data.unit}`} />
            <DetailLine label="Stock minimo" value={`${query.data.minimum_stock} ${query.data.unit}`} />
            <DetailLine label="Costo" value={formatCurrency(query.data.unit_cost)} />
            <DetailLine label="Precio" value={formatCurrency(query.data.sale_price)} />
            {query.data.current_stock <= query.data.minimum_stock ? (
              <AppText color={colors.warning}>Alerta: este producto llego al inventario minimo.</AppText>
            ) : null}
          </Card>
          <Card style={styles.wrap}>
            <AppText variant="subtitle">Historial</AppText>
            {movementsQuery.isLoading ? <LoadingState title="Cargando movimientos" /> : null}
            {(movementsQuery.data ?? []).map((movement: InventoryMovement) => (
              <DetailLine
                key={movement.id}
                label={movementTypeOptions.find((option) => option.value === movement.movement_type)?.label ?? movement.movement_type}
                value={`${movement.quantity} ${movement.unit} · ${formatDate(movement.created_at)}`}
              />
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <AppText variant="label">{label}</AppText>
      <AppText color={colors.mutedText}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  hubGrid: {
    gap: spacing.md
  },
  hubCard: {
    gap: spacing.sm
  },
  toolbar: {
    gap: spacing.sm
  },
  list: {
    gap: spacing.sm
  },
  detailLine: {
    gap: spacing.xxs
  }
});
