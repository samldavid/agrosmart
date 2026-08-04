import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const sql = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
  .join("\n");

describe("contratos criticos de RLS", () => {
  it("activa RLS en tablas sensibles", () => {
    for (const table of [
      "profiles",
      "farms",
      "farm_members",
      "animals",
      "agricultural_products",
      "inventory_movements",
      "tasks",
      "reminders",
      "financial_movements",
      "support_tickets",
      "support_messages",
      "notifications",
      "audit_logs"
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("impide que productores consulten otras fincas", () => {
    expect(sql).toContain("farms_select_members");
    expect(sql).toContain("app_private.is_farm_member(id)");
  });

  it("permite que el propietario lea la finca que acaba de crear", () => {
    expect(sql).toContain("owner_id = (select auth.uid())");
  });

  it("impide que trabajadores eliminen o modifiquen configuraciones criticas de finca", () => {
    expect(sql).toContain("farms_update_owner_admin");
    expect(sql).toContain("app_private.is_farm_owner(id)");
  });

  it("evita que soporte consulte finanzas privadas", () => {
    expect(sql).toContain("finances_select_private");
    expect(sql).not.toContain("financial_movements for select to authenticated\nusing (app_private.is_support()");
  });

  it("bloquea operaciones de usuarios inactivos o bloqueados", () => {
    expect(sql).toContain("app_private.is_active()");
    expect(sql).toContain("Cuenta bloqueada o inactiva.");
  });

  it("valida que una salida de inventario no deje stock negativo", () => {
    expect(sql).toContain("v_product.current_stock + v_delta < 0");
    expect(sql).toContain("La salida deja el inventario en cantidad invalida.");
  });
});
