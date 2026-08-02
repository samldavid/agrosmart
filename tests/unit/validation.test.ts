import {
  animalSchema,
  farmSchema,
  financialMovementSchema,
  inventoryMovementSchema,
  productSchema,
  reminderSchema,
  signInSchema,
  signUpSchema,
  supportTicketSchema,
  taskSchema,
  workerInviteSchema
} from "@/schemas/forms";

describe("validaciones principales", () => {
  it("valida autenticacion con correo y contrasena", () => {
    expect(signInSchema.safeParse({ email: "productor@demo.com", password: "123456" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "mal", password: "123" }).success).toBe(false);
  });

  it("exige aceptar privacidad en registro", () => {
    expect(
      signUpSchema.safeParse({
        email: "productor@demo.com",
        password: "123456",
        full_name: "Productor Demo",
        accepted_privacy: true
      }).success
    ).toBe(true);
    expect(
      signUpSchema.safeParse({
        email: "productor@demo.com",
        password: "123456",
        full_name: "Productor Demo",
        accepted_privacy: false
      }).success
    ).toBe(false);
  });

  it("valida creacion de finca", () => {
    expect(
      farmSchema.safeParse({
        name: "La Esperanza",
        production_type: "mixed",
        department: "Meta",
        municipality: "Granada",
        area: 12,
        area_unit: "hectares"
      }).success
    ).toBe(true);
  });

  it("valida animal y producto sin cantidades negativas", () => {
    expect(
      animalSchema.safeParse({
        identification_code: "BOV-001",
        species: "Bovino",
        sex: "female",
        weight: 400,
        weight_unit: "kg",
        status: "active"
      }).success
    ).toBe(true);

    expect(
      productSchema.safeParse({
        name: "Maiz",
        category: "cereal",
        unit: "kg",
        current_stock: -1,
        minimum_stock: 0,
        unit_cost: 0,
        sale_price: 0,
        status: "active"
      }).success
    ).toBe(false);
  });

  it("valida movimientos de inventario con cantidad positiva", () => {
    expect(
      inventoryMovementSchema.safeParse({
        product_id: "producto",
        movement_type: "exit",
        quantity: 0,
        unit: "kg",
        unit_value: 1000,
        reason: "Venta"
      }).success
    ).toBe(false);
  });

  it("valida tareas, recordatorios, finanzas, soporte y trabajadores", () => {
    expect(taskSchema.safeParse({ title: "Revisar potrero", category: "ganado" }).success).toBe(true);
    expect(
      reminderSchema.safeParse({
        title: "Vacunar",
        category: "vacunacion",
        reminder_date: "2026-08-10",
        recurrence: "none",
        status: "pending"
      }).success
    ).toBe(true);
    expect(
      financialMovementSchema.safeParse({
        type: "expense",
        category: "insumos",
        description: "Compra",
        amount: 1000,
        transaction_date: "2026-08-01"
      }).success
    ).toBe(true);
    expect(
      supportTicketSchema.safeParse({
        subject: "Ayuda",
        description: "Necesito soporte",
        category: "otro",
        priority: "medium"
      }).success
    ).toBe(true);
    expect(
      workerInviteSchema.safeParse({
        email: "trabajador@demo.com",
        role: "worker",
        can_manage_inventory: "true",
        can_report_expenses: "false",
        can_manage_tasks: "true"
      }).success
    ).toBe(true);
  });
});
