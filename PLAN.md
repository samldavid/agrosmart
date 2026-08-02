# PLAN.md - AgroSmart MVP

## Fuentes revisadas

- `PROYECTO INTEGRADOR AGROSMART.docx`: define AgroSmart como una aplicacion movil para organizar fincas agricolas y ganaderas, tareas de trabajadores, gastos, soporte tecnico y una tienda virtual futura.
- `pasted-text.txt`: aterriza el alcance inicial en registro, perfil, ganado, productos, inventario, recordatorios, reportes, soporte y panel administrativo.
- Imagenes de marca adjuntas: logo original con vaca, planta y surcos; estilo natural, premium, confiable y limpio. Paleta base: verdes sobrios, salvia, beige, crema y blanco. Tipografia objetivo: Playfair Display para marca/titulos y Montserrat para interfaz.
- Repositorio actual: carpeta vacia, sin Git inicializado ni aplicacion existente.

## Arquitectura propuesta

AgroSmart se construira como una aplicacion Expo + React Native + TypeScript con soporte Android, iOS y web.

- **Cliente multiplataforma**: Expo Router, React Native, TypeScript estricto, componentes reutilizables, formularios con React Hook Form y Zod.
- **Backend administrado**: Supabase Auth, PostgreSQL, Storage privado, Row Level Security y funciones SQL para operaciones sensibles.
- **Datos y cache**: TanStack Query como capa principal de consultas, mutaciones, invalidacion, estados de carga/error y cache reciente.
- **Capa de dominio**: repositorios por modulo para aislar Supabase de las pantallas y facilitar sincronizacion offline futura.
- **Estado local**: estado global minimo para sesion, finca activa, conectividad y borradores. El resto vive en Query Cache y formularios.
- **Seguridad**: permisos reales en base de datos mediante RLS, validacion en cliente, constraints SQL, auditoria y Storage privado con URLs firmadas.
- **Offline MVP**: deteccion de conexion, cache de consultas recientes, borradores locales de formularios y reintento simple de mutaciones fallidas. Sin motor bidireccional completo en esta fase.

## Estructura de carpetas

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
  (onboarding)/
  (app)/
    _layout.tsx
    dashboard.tsx
    production/
    tasks/
    reminders/
    finances/
    reports/
    support/
    settings/
  admin/
assets/
  brand/
  fonts/
src/
  components/
    feedback/
    forms/
    layout/
    primitives/
  constants/
  features/
    admin/
    animals/
    auth/
    dashboard/
    farms/
    finances/
    inventory/
    notifications/
    products/
    reminders/
    reports/
    support/
    tasks/
    workers/
  hooks/
  lib/
    supabase.ts
    queryClient.ts
    errors.ts
    formatters.ts
  repositories/
  schemas/
  theme/
  types/
  utils/
supabase/
  migrations/
  seed.sql
  README.md
tests/
  unit/
  components/
  rls/
docs/
```

## Modelo de datos

Tablas principales:

- `profiles`: perfil publico operativo enlazado a `auth.users`, con rol global (`producer`, `worker`, `support`, `admin`) y estado (`active`, `blocked`, `pending`).
- `farms`: fincas de productores, con propietario, tipo de produccion, ubicacion, area y estado.
- `farm_members`: relacion usuario-finca con rol dentro de finca, permisos JSON y estado.
- `animals`: ganado por finca con identificacion, especie, raza, sexo, fechas, peso, estado, foto y notas.
- `agricultural_products`: productos/cultivos por finca con unidad, stock actual, minimo, costos, precio, imagen y estado.
- `inventory_movements`: historial inmutable de entradas, salidas, perdidas, ventas y ajustes. El stock de productos se mantiene en `agricultural_products.current_stock` mediante funcion SQL transaccional y tambien puede reconstruirse desde movimientos.
- `tasks`: tareas por finca, asignables a miembros, con prioridad, estado, fecha limite y cierre.
- `reminders`: recordatorios por finca, recurrentes o puntuales, asociados opcionalmente a animales, productos o tareas.
- `financial_movements`: ingresos y gastos administrativos basicos. No contabilidad profesional.
- `support_tickets` y `support_messages`: soporte conversacional con adjuntos privados.
- `notifications`: notificaciones internas.
- `audit_logs`: eventos criticos para seguridad y panel administrativo.
- `system_announcements`: avisos internos enviados por administradores.

Validaciones SQL:

- Enumeraciones o `check constraints` para roles, estados, prioridades, tipos de movimiento, unidades y recurrencias.
- `foreign keys` con borrado restrictivo o anulacion controlada.
- Indices por `farm_id`, `owner_id`, `user_id`, `status`, fechas y campos de busqueda frecuente.
- `updated_at` automatico con trigger.
- Auditoria mediante triggers y funciones `security definer` donde aplique.

## Permisos y RLS

- Productores propietarios ven y modifican sus fincas y registros relacionados.
- Trabajadores ven la finca donde son miembros activos, actualizan sus tareas, registran observaciones, movimientos autorizados y novedades permitidas.
- Soporte ve tickets asignados o tickets abiertos para atencion; no ve finanzas privadas.
- Administradores ven y gestionan usuarios, roles, fincas, soporte, avisos, auditoria y metricas generales.
- Usuarios bloqueados no pueden operar aunque tengan sesion activa.
- Las politicas RLS se implementan en todas las tablas sensibles; la UI solo complementa, no sustituye permisos.

## Modulos MVP

- **Autenticacion**: splash, presentacion breve, registro, login, recuperacion, verificacion de correo, privacidad y cierre de sesion.
- **Configuracion inicial**: perfil, primera finca, actividad agricola/ganadera/mixta y guia corta.
- **Dashboard productor**: resumen de animales, productos, bajo inventario, tareas, recordatorios, finanzas y soporte.
- **Fincas y trabajadores**: edicion de finca, miembros, invitacion/asociacion por correo y permisos basicos.
- **Ganado**: listado, filtros, formulario, detalle, edicion, cambio de estado, foto y novedades basicas.
- **Agricultura e inventario**: productos, imagenes, stock, costos, precios, entradas, salidas, perdidas, ventas, ajustes e historial.
- **Tareas**: creacion, asignacion, filtros, detalle, comentarios simples mediante notas y cambios de estado.
- **Recordatorios**: calendario mensual, proximos eventos, recurrencia basica, marcar realizado y reprogramar.
- **Finanzas basicas**: ingresos, gastos, comprobantes, resumen mensual, balance simple y aviso no contable.
- **Reportes**: inventario, movimientos, animales, productos, tareas, gastos, ingresos, balance, filtros por fecha, CSV y vista imprimible/PDF compatible con Expo.
- **Soporte**: tickets, mensajes, adjuntos, estados, prioridad y cierre.
- **Administracion web responsive**: dashboard, usuarios, fincas, soporte, avisos y auditoria.
- **Notificaciones internas**: lista, lectura, avisos y eventos de soporte/recordatorios.

## Rutas y pantallas

### Publicas y autenticacion

- `/`: splash y redireccion segun sesion/onboarding.
- `/(auth)/welcome`: presentacion breve de AgroSmart.
- `/(auth)/sign-in`: inicio de sesion.
- `/(auth)/sign-up`: registro con correo y contrasena.
- `/(auth)/forgot-password`: recuperacion de contrasena.
- `/(auth)/verify-email`: instrucciones de verificacion.
- `/(auth)/privacy`: politica de privacidad inicial.

### Onboarding

- `/(onboarding)/profile`: datos personales.
- `/(onboarding)/farm`: primera finca.
- `/(onboarding)/guide`: guia corta y seleccion de finca activa.

### Productor/trabajador

- `/(app)/dashboard`: inicio.
- `/(app)/production`: hub de produccion.
- `/(app)/production/animals`: ganado.
- `/(app)/production/animals/[id]`: detalle de animal.
- `/(app)/production/products`: productos agricolas.
- `/(app)/production/products/[id]`: detalle de producto.
- `/(app)/production/inventory-movements`: movimientos.
- `/(app)/tasks`: tareas.
- `/(app)/tasks/[id]`: detalle de tarea.
- `/(app)/reminders`: calendario y recordatorios.
- `/(app)/finances`: finanzas basicas.
- `/(app)/reports`: reportes.
- `/(app)/support`: tickets.
- `/(app)/support/[id]`: conversacion de soporte.
- `/(app)/settings`: perfil, finca, trabajadores, seguridad, privacidad, notificaciones, ayuda y acerca.

### Administracion

- `/admin`: dashboard administrativo.
- `/admin/users`: usuarios.
- `/admin/farms`: fincas.
- `/admin/support`: soporte.
- `/admin/announcements`: avisos.
- `/admin/audit`: auditoria.

## Sistema de diseno

- Tokens en `src/theme`: colores, tipografia, espaciado, radios, sombras y estados.
- Fuentes cargadas con Expo Font: Playfair Display y Montserrat.
- Logo original en `assets/brand`.
- Componentes base: botones grandes, campos, tarjetas, badges, modales, skeleton loaders, empty states, offline banner, tablas/listas adaptables, tabs, bottom navigation movil y sidebar web/tablet.
- UX en espanol de Colombia, COP, fechas `dd/MM/yyyy`, zona `America/Bogota`.
- Accesibilidad: labels, roles, contraste, tamanos tactiles, texto alternativo, foco por teclado en web.

## Fases de implementacion

### Fase 1 - Base, autenticacion, DB, RLS y navegacion

- Crear proyecto Expo Router con TypeScript estricto.
- Configurar ESLint, Prettier, Jest, Testing Library, variables de entorno y assets.
- Implementar tema AgroSmart, fuentes, logo y componentes base.
- Crear cliente Supabase, Query Client, manejo de errores y sesion.
- Crear migraciones iniciales, roles, RLS, Storage buckets y seed base.
- Implementar auth, privacidad, navegacion responsiva y selector de finca.
- Verificar typecheck, lint y tests.

### Fase 2 - Perfiles, fincas y trabajadores

- CRUD de perfil y finca.
- Onboarding.
- Miembros/trabajadores, asociacion por correo, roles de finca y permisos.
- Pruebas de creacion de finca y permisos de trabajador.

### Fase 3 - Ganado, productos e inventario

- CRUD de animales.
- CRUD de productos agricolas.
- Movimientos de inventario transaccionales.
- Historial y alertas de stock minimo.
- Pruebas de validacion, permisos y stock no negativo.

### Fase 4 - Tareas, recordatorios y calendario

- CRUD de tareas, asignacion y cambios de estado.
- Calendario mensual y proximos recordatorios.
- Recurrencia basica, marcar realizado, reprogramar.
- Notificaciones internas derivadas.

### Fase 5 - Finanzas y reportes

- Ingresos/gastos administrativos, comprobantes privados y resumen mensual.
- Reportes filtrables, CSV y version imprimible/PDF.
- Advertencia visible de alcance no contable.

### Fase 6 - Soporte y notificaciones internas

- Tickets, mensajes, adjuntos, prioridad, estados y cierre.
- Vistas productor/trabajador/soporte.
- Notificaciones internas de soporte y recordatorios.

### Fase 7 - Panel administrativo y auditoria

- Dashboard admin.
- Gestion de usuarios, roles, bloqueos.
- Consulta de fincas con restricciones.
- Soporte administrativo, avisos y auditoria.

### Fase 8 - Pruebas, accesibilidad, optimizacion y documentacion

- Completar pruebas unitarias, componentes y RLS.
- Revisar accesibilidad y responsive web/movil.
- Completar README, ARCHITECTURE, SECURITY, DEMO, OFFLINE-ROADMAP, MARKETPLACE-ROADMAP.
- Ejecutar typecheck, lint, tests y build.

## Riesgos tecnicos

- **Alcance amplio para un MVP**: se resolvera con CRUD real y flujos completos, dejando marketplace, sanitario avanzado y sincronizacion bidireccional en roadmap.
- **Supabase externo no configurado**: se entregan migraciones, seed y `.env.example`; la app funciona al configurar URL y anon key.
- **RLS complejo**: se cubren politicas criticas y pruebas SQL para productor/trabajador/soporte/admin.
- **Offline rural**: el MVP tendra cache, indicador y borradores; la sincronizacion robusta queda disenada pero no implementada.
- **Expo web + native**: se evitaran librerias no compatibles y se usaran APIs Expo.
- **Adjuntos privados**: se usaran buckets privados y URLs firmadas; sin service role key en cliente.
- **Build nativo**: se verificara web/export local; builds Android/iOS requeriran EAS o entorno nativo configurado.

## Criterios de aceptacion

- Registro, inicio de sesion, recuperacion y cierre de sesion funcionan con Supabase Auth.
- Productor crea perfil, finca, trabajadores, animales, productos, movimientos, tareas, recordatorios, finanzas y tickets.
- Admin gestiona usuarios, roles, bloqueos, tickets, avisos y auditoria desde web responsive.
- Trabajador puede ver su finca y tareas, actualizar tareas y registrar acciones permitidas.
- Soporte atiende tickets sin acceso a finanzas privadas.
- RLS impide acceso cruzado entre fincas, operaciones de usuarios bloqueados y acciones no autorizadas.
- Inventario no acepta salidas que dejen stock invalido.
- Todas las pantallas principales tienen carga, error, vacio y confirmaciones.
- Diseno usa logo, colores, tipografias y tono AgroSmart.
- La app es usable en movil y web, con bottom nav movil y sidebar en pantallas grandes.
- Documentacion permite ejecutar desde cero, configurar Supabase, cargar demo, probar y construir.
- `typecheck`, `lint`, `tests` y `build` pasan sin errores conocidos.

## Estado de avance

- [x] Revision de adjuntos y repositorio.
- [x] Plan de arquitectura inicial.
- [x] Fase 1: configuracion, diseno base, autenticacion, DB, RLS y navegacion.
- [x] Fase 2: perfiles, fincas, miembros y trabajadores.
- [x] Fase 3: ganado, agricultura, productos, inventario y movimientos.
- [x] Fase 4: tareas, recordatorios y calendario.
- [x] Fase 5: finanzas basicas y reportes.
- [x] Fase 6: soporte y notificaciones internas.
- [x] Fase 7: panel administrativo y auditoria.
- [x] Fase 8: pruebas, accesibilidad basica, optimizacion, documentacion y datos demo.

## Verificacion final

- `npm run typecheck`: pasa.
- `npm run lint`: pasa.
- `npm run test`: 14 pruebas pasan.
- `npm run build`: pasa y genera `dist`.
