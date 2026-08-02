# DEMO.md

## Cuentas demo

El repositorio no incluye contrasenas ni secretos. Crea estas cuentas en Supabase Auth:

- `productor.demo@agrosmart.local`
- `trabajador1.demo@agrosmart.local`
- `trabajador2.demo@agrosmart.local`
- `soporte.demo@agrosmart.local`
- `admin.demo@agrosmart.local`

Usa contrasenas temporales locales y cambialas al entregar.

## Cargar datos

1. Ejecuta `supabase/migrations/20260802000000_initial_schema.sql`.
2. Crea las cuentas demo.
3. Ejecuta `supabase/seed.sql`.
4. Inicia la app con `npm run web`.

El seed crea una finca mixta, trabajadores, 10 animales, 5 productos, movimientos, tareas, recordatorios, finanzas, tickets, mensajes y avisos.
