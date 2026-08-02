# Supabase - AgroSmart

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/migrations/20260802000000_initial_schema.sql` desde Supabase SQL Editor o con Supabase CLI.
3. Copia `Project URL` y `anon public key` a `.env`.
4. Crea los usuarios demo desde Supabase Auth o desde la app y luego ejecuta `supabase/seed.sql` ajustando los UUID indicados.
5. Verifica que Auth email/password este habilitado.
6. Mantén privados los buckets creados por la migracion.

Nunca uses la service role key en Expo.
