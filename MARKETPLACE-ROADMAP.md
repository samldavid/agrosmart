# MARKETPLACE-ROADMAP.md

El MVP no implementa compraventas reales ni pagos reales.

## Arquitectura futura

- `marketplace_listings`: publicaciones de productos.
- `marketplace_orders`: pedidos entre productor y comprador.
- `marketplace_messages`: contacto seguro.
- `subscriptions`: planes AgroSmart.
- `commissions`: comisiones calculadas, no pagos directos.
- Integracion futura con PSE o Nequi mediante proveedor autorizado.

## Seguridad financiera

- No almacenar tarjetas, claves bancarias ni credenciales financieras.
- Usar proveedor certificado y webhooks verificados.
- Separar datos operativos de datos comerciales publicos.
- Moderacion y reportes de publicaciones.
