# SECURITY.md - AgroSmart

## Modelo de amenazas basico

- Acceso cruzado entre fincas.
- Usuarios bloqueados intentando operar.
- Trabajadores modificando configuracion critica.
- Soporte accediendo a finanzas privadas.
- Adjuntos o comprobantes expuestos publicamente.
- Secretos filtrados al cliente.

## Controles implementados

- RLS habilitado en todas las tablas publicas sensibles.
- Politicas por propietario, miembro, soporte y administrador.
- Funcion `record_inventory_movement` valida stock no negativo en transaccion.
- Storage buckets privados para avatares, animales, productos, recibos y soporte.
- No se usa service role key en cliente.
- Errores de Supabase se traducen a mensajes seguros para usuario.
- Auditoria para cambios de rol, estado, finca, inventario y tickets.
- Solicitud de exportacion/eliminacion desde configuracion.

## Pendiente antes de produccion

- Configurar expiracion corta de JWT segun riesgo.
- Ejecutar Supabase Advisors en el proyecto real.
- Revisar rate limiting en Auth y endpoints RPC.
- Configurar backups y restauracion probada.
- Revisar politicas de Storage por ruta/finca para aislamiento mas granular.
- Resolver auditoria npm moderada cuando Expo publique fixes no destructivos.
