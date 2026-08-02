# ARCHITECTURE.md - AgroSmart

AgroSmart es una app Expo + React Native + Expo Router con TypeScript estricto. El backend es Supabase: Auth, PostgreSQL, Storage privado y Row Level Security.

## Capas

- `app/`: rutas Expo Router para auth, onboarding, app protegida y admin web.
- `src/components/`: sistema de diseño base: texto, botones, tarjetas, formularios, estados.
- `src/features/`: pantallas por dominio.
- `src/repositories/`: acceso a Supabase y RPCs.
- `src/schemas/`: validaciones Zod compartidas.
- `src/providers/`: sesion, finca activa, conectividad y Query Client.
- `supabase/migrations/`: esquema SQL, RLS, Storage y funciones.

## Decisiones clave

- El historial de inventario vive en `inventory_movements`; `current_stock` se actualiza con `record_inventory_movement`.
- Las reglas de acceso viven en RLS y helpers privados `app_private`.
- La UI oculta acciones no permitidas, pero no es la barrera de seguridad.
- Offline completo queda preparado con repositorios, Query cache y borradores, sin sincronizacion bidireccional en MVP.
