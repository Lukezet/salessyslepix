# Flujos reutilizables — Frontend

## publication-catalog
Usar en grillas y fichas de inmuebles/vehículos. Exponer sólo atributos pertinentes de cada tipo y estados públicos seguros.

## map-search
Usar para explorar publicaciones. Sincronizar viewport y filtros con la API, agrupar marcadores a bajo zoom y abrir una tarjeta antes de cargar la ficha completa.

## appointments
Usar para elegir y confirmar visitas. Mostrar slots reales, duración y buffer; no permitir confirmar dos veces ni inventar disponibilidad local.

## feature-flags
Usar para habilitar módulos por agencia y ocultar capacidades no contratadas sin reemplazar la autorización de API.
El módulo `store` incluye catálogo de productos, creación de categorías, carrito, ventas y actualización de la cotización USD/ARS.

## admin-premium
Usar para pantallas operativas de plataforma o catálogo. Componer el encabezado con `admin-title` y `admin-subtitle`; ubicar el contenido en `admin-shell` y aplicar `admin-glass` o `admin-card` a las superficies. Usar `admin-primary` y `admin-secondary` como acciones minimalistas transparentes, con borde frío sólo al interactuar. El alcance es exclusivamente `/admin`: el portal público conserva el branding de su tenant.
Para clientes, ofrecer Previsualizar, Acceder y Administrar. Desactivar conserva sus datos pero retira su portal público; los módulos se pueden combinar.
