# Guía de trabajo — Frontend

- Este repositorio contiene React 19 + Vite. No modificar `main`; trabajar en ramas con prefijo del propietario.
- Consumir contratos normalizados desde `src/services`; no duplicar contratos API dentro de páginas.
- Componer rutas, menús, filtros y acciones desde las feature flags de la empresa, pero asumir que el backend también las valida.
- Para el portal, sustituir el carrito/checkout por publicaciones, leads y agenda de visitas de forma incremental.
- El mapa sólo muestra coordenadas públicas; nunca revelar dirección privada en componentes, HTML o requests públicas.
- La reserva confirma sólo después de respuesta satisfactoria de API; mostrar conflictos y horarios no disponibles de forma clara.
- Ejecutar `npm run lint` y `npm run build` antes de finalizar.

## Dirección visual — Administración premium

- Las pantallas bajo `/admin` usan el sistema visual `admin-premium`, aislado del portal público y de la identidad configurable de cada cliente.
- Para `PlatformAdmin`, la navegación superior usa `admin-navbar`: no mostrar el nombre del tenant ni aplicar el color de marca del portal público.
- El módulo `store` agrupa catálogo, categorías, carrito, ventas y cotización de dólar. Su visibilidad debe depender de la feature flag y el backend mantiene la validación de acceso.
- Al crear una empresa, el logo cargado se persiste con la empresa y se reutiliza en la tarjeta administrativa, el encabezado del portal y su favicon. La paleta extraída debe permanecer asociada a esa misma empresa.
- El favicon se resuelve por ruta: las rutas públicas de un cliente (`/:clientSlug` y `/:clientSlug/home`) usan su logo; las rutas administrativas conservan el icono general de Lepix.
- En el portal público, la identidad centrada es el logo si existe o el nombre en mayúsculas si no; ambos llevan al inicio del cliente. Un usuario con rol Admin o PlatformAdmin siempre ve el acceso Panel.
- La navegación de escritorio usa controles homogéneos separados por líneas verticales; no mezclar botones encapsulados con enlaces planos en la misma barra.
- Carrito, catálogo, cotización y operaciones de Tienda sólo se muestran si la configuración ya cargada de la empresa de la ruta habilita `store`; nunca usar valores por defecto para mostrarlos.
- Cada tarjeta de cliente ofrece previsualización, acceso y administración. La administración desactiva el portal de forma reversible, permite actualizar marca y modifica módulos de manera acumulativa (por ejemplo, Inmobiliaria + Tienda).
- Mantener la estética dark-luxe: base azul noche, paneles translúcidos, texto de alto contraste y acentos fríos azul/cian. No aplicar estos colores al storefront ni sobrescribir variables `--tenant-*`.
- Priorizar una jerarquía limpia: título grande, breve descripción y una acción primaria inequívoca. Evitar rótulos pequeños decorativos encima del título. Las acciones deben ser minimalistas y transparentes, con borde de color sólo en hover, focus o active.
- Todos los títulos del admin, incluido el rótulo central de navegación, deben usar `--heading-font`, peso 700 y espaciado sobrio; no introducir fuentes o pesos alternativos por sección.
- Reutilizar `admin-shell`, `admin-glass`, `admin-card`, `admin-primary`, `admin-secondary` y `admin-chip` antes de crear estilos ad hoc. Conservar foco visible, estados disabled y etiquetas accesibles.
