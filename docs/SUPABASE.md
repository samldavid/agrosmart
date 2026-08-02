# Configuracion de Supabase

1. Crea un proyecto Supabase.
2. Habilita Email/Password en Auth.
3. Ejecuta `supabase/migrations/20260802000000_initial_schema.sql`.
4. Verifica que los buckets `agrosmart-*` sean privados.
5. Copia `Project URL` y `publishable key` a `.env`.
6. Ejecuta `supabase/seed.sql` solo despues de crear cuentas demo.

Variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
EXPO_PUBLIC_APP_TIME_ZONE=America/Bogota
EXPO_PUBLIC_APP_LOCALE=es-CO
```

No uses service role key en Expo. La app tambien acepta `EXPO_PUBLIC_SUPABASE_ANON_KEY` por compatibilidad con proyectos antiguos.
