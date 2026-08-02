# AgroSmart

Aplicacion MVP para administracion de fincas agricolas y ganaderas. Usa Expo, React Native, Expo Router, TypeScript, Supabase, PostgreSQL, RLS, TanStack Query, React Hook Form y Zod.

## Requisitos

- Node.js 20 o superior.
- Proyecto Supabase.
- Android Studio o Expo Go para Android.
- Navegador moderno para web.

## Instalacion

```bash
npm install
cp .env.example .env
npm run web
```

Configura `.env` con Supabase antes de usar funciones persistentes. En Expo usa `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Supabase

Ejecuta:

```bash
# En Supabase SQL Editor o CLI
supabase/migrations/20260802000000_initial_schema.sql
supabase/seed.sql
```

Ver tambien [docs/SUPABASE.md](docs/SUPABASE.md).

## Scripts

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run android
npm run web
```

## Funciones incluidas

- Registro, login, recuperacion y cierre de sesion.
- Onboarding de perfil y primera finca.
- Dashboard productor.
- Ganado, productos e inventario con movimientos reales.
- Tareas asignables y recordatorios.
- Finanzas basicas y reportes con CSV/PDF imprimible.
- Soporte con tickets y conversacion.
- Configuracion, trabajadores, privacidad y exportacion de datos.
- Panel admin responsive para usuarios, fincas, soporte, avisos y auditoria.
- Migracion Supabase con RLS y Storage privado.

## Verificacion local

Ultima verificacion ejecutada:

- `npm run typecheck`: pasa.
- `npm run lint`: pasa.
- `npm run test`: 14 pruebas pasan.
- `npm run build`: pasa y genera `dist`.

## Android

```bash
npm run android
```

Usa Expo Go o un emulador. Para builds instalables configura EAS:

```bash
npx eas build --platform android
```

## Web

```bash
npm run web
```

Build estatica:

```bash
npm run build
```

## Documentacion

- [PLAN.md](PLAN.md)
- [DECISIONS.md](DECISIONS.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [SECURITY.md](SECURITY.md)
- [DEMO.md](DEMO.md)
- [OFFLINE-ROADMAP.md](OFFLINE-ROADMAP.md)
- [MARKETPLACE-ROADMAP.md](MARKETPLACE-ROADMAP.md)
- [docs/ROLES.md](docs/ROLES.md)
