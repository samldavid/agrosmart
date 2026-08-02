# OFFLINE-ROADMAP.md

El MVP incluye deteccion de conexion, cache de TanStack Query, borradores locales y reintentos simples.

## Fase 2 offline

1. Crear cola local de mutaciones con identificadores temporales.
2. Guardar cambios en SQLite local compatible con Expo.
3. Agregar estados `pending_sync`, `synced`, `failed`.
4. Resolver conflictos por entidad con version/updated_at.
5. Sincronizar por finca activa y permisos.
6. Mostrar bandeja de pendientes al usuario.
7. Cubrir pruebas de reconexion, duplicados y conflictos.

No se implementa sincronizacion bidireccional completa en el MVP para evitar perdida de datos por conflictos mal resueltos.
