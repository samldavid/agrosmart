# DECISIONS.md - AgroSmart

## 2026-08-02 - Proyecto desde cero

- **Decision**: crear una aplicacion Expo Router nueva en este repositorio vacio.
- **Motivo**: no existia codigo previo, `package.json` ni control Git local.
- **Impacto**: la estructura se define desde cero siguiendo el plan del MVP.

## 2026-08-02 - Supabase como backend unico del MVP

- **Decision**: todas las operaciones persistentes usan Supabase Auth, PostgreSQL, Storage y RLS.
- **Motivo**: el requerimiento pide permisos reales en base de datos y evitar datos estaticos para funciones que guardan informacion.
- **Impacto**: sin `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` la app muestra una pantalla de configuracion pendiente, no datos simulados.

## 2026-08-02 - Sin service role en cliente

- **Decision**: el cliente solo acepta `anon key`; no se usara ni documentara la service role key en la app.
- **Motivo**: la service role saltaria RLS y expondria privilegios criticos.
- **Impacto**: operaciones administrativas tambien pasan por RLS y funciones SQL seguras.

## 2026-08-02 - Estrategia de inventario

- **Decision**: `inventory_movements` sera el historial inmutable y `agricultural_products.current_stock` se actualizara mediante una funcion SQL transaccional.
- **Motivo**: permite consultas rapidas en la app y conserva auditoria completa para reconstruir inventario.
- **Impacto**: las salidas validan stock suficiente en base de datos y no dependen solo del cliente.

## 2026-08-02 - Modo offline MVP

- **Decision**: implementar deteccion de conexion, cache de TanStack Query, borradores locales y reintentos simples; no construir sincronizacion bidireccional completa.
- **Motivo**: el documento reconoce conectividad rural limitada, pero el motor offline robusto excede el MVP inicial.
- **Impacto**: se documenta la arquitectura futura en `OFFLINE-ROADMAP.md`.

## 2026-08-02 - Marketplace y pagos fuera del MVP funcional

- **Decision**: no implementar pagos, tienda real, PSE ni Nequi en el MVP.
- **Motivo**: requiere proveedor autorizado, contratos, seguridad financiera y cumplimiento adicional.
- **Impacto**: se documenta la arquitectura futura en `MARKETPLACE-ROADMAP.md`.

## 2026-08-02 - Telefono y notificaciones push preparados

- **Decision**: preparar campos y arquitectura para telefono y push, pero el MVP usa correo/contrasena e internas.
- **Motivo**: Supabase SMS y push requieren configuracion externa que no esta disponible en los adjuntos.
- **Impacto**: la app no bloquea el registro por falta de SMS ni inventa credenciales.

## 2026-08-02 - Reportes exportables

- **Decision**: CSV se generara localmente y la version imprimible/PDF usara APIs compatibles con Expo.
- **Motivo**: evita servicios externos y mantiene soporte web/movil.
- **Impacto**: los reportes basicos se pueden compartir/descargar sin backend adicional.

## 2026-08-02 - Migracion Supabase creada sin CLI local

- **Decision**: crear `supabase/migrations/20260802000000_initial_schema.sql` manualmente.
- **Motivo**: el comando `supabase` no esta instalado en esta maquina, por lo que no es posible ejecutar `supabase migration new`.
- **Impacto**: el archivo mantiene el formato esperado por Supabase y puede ejecutarse luego con Supabase CLI, SQL editor o CI.
