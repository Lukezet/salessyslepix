import { moduleDictionary } from "../../services/moduleDictionary.js";
const step = (target, title, description) => ({ target, title, description });

export const TOURS = {
  modules: [
    step(null, "Configurá una vez, reutilizá en tus empresas", "Elegí los módulos que tendrá cada categoría. La configuración general sirve para todas las empresas que la siguen."),
    step("module-scope", "General o una excepción", "Trabajá en la configuración general para cambiar una categoría sin elegir una empresa. Personalizá una empresa solamente cuando necesite algo distinto."),
    step("module-library", "Elegí un módulo", "Buscá en la biblioteca y añadí el módulo a una categoría compatible. También podés arrastrarlo. Un mismo módulo no se puede añadir dos veces a la misma categoría."),
    step("module-categories", "Revisá cada categoría", "Acá ves los módulos asignados. Por ejemplo, añadí Precio de USD a Vehículos en la configuración general para que lo reciban las empresas que la siguen. Quitar retira el módulo de esa categoría."),
    step(null, "Los cambios se guardan al añadir o quitar", "Cada acción se guarda automáticamente. Esperá el mensaje de confirmación. Los cambios generales se comparten; una personalización afecta solamente a la empresa elegida. Restablecer configuración general elimina las excepciones de esa empresa."),
  ],
  clients: [
    step(null, "Administrá tus clientes", "Desde este panel creás empresas y accedés a sus portales. Cada empresa mantiene su identidad y sus usuarios."),
    step("client-create", "Creá una empresa", "Este acceso abre el formulario de datos, categorías, marca y administrador inicial. La guía no crea ni guarda datos por vos."),
    step("client-list", "Revisá el portal", "Cada tarjeta ofrece previsualización, acceso al portal y administración. Previsualizar permite comprobar qué verá un visitante."),
  ],
  clientCreate: [
    step(null, "Creá el portal paso a paso", "Completá los datos de la empresa, elegí sus categorías, ajustá la marca y definí quién la administrará. Podés cerrar esta guía y volver a abrirla cuando quieras."),
    step("client-basics", "Datos de la empresa", "Indicá el nombre comercial y los datos de contacto que corresponden a esta empresa."),
    step("client-domain", "Dirección del portal", "Podés usar la ruta de la plataforma o indicar un dominio propio. Registrar el dominio aquí no configura su DNS."),
    step("client-features", "Categorías habilitadas", "Elegí Tienda, Inmobiliaria o Vehículos. Sus módulos siguen la configuración general; después podés definir excepciones si esta empresa las necesita."),
    step("client-branding", "Su propia identidad", "Cargá el logo y ajustá la paleta. Revisá la vista previa antes de continuar."),
    step("client-admin", "Administrador inicial", "Creá el usuario que gestionará esta empresa. Usá una contraseña de al menos 12 caracteres y entregá el acceso por un canal seguro."),
    step("client-submit", "Revisá y creá", "Este botón envía el formulario. La empresa se crea solamente cuando lo presionás y el servidor confirma la operación."),
  ],
  portal: [
    step(null, "Conocé tu portal", "Te acompañamos paso a paso para que aprendas a usar este portal."),
    step("portal-menu", "Navegación en el celular", "Abrí este menú para acceder a las herramientas disponibles para tu usuario. Podés volver a este recorrido desde el botón ? de ayuda."),
    step("portal-search", "Buscá en este portal", "Escribí qué buscás para consultar las publicaciones disponibles."),
    step("portal-categories", "Explorá el catálogo", "Elegí una categoría para consultar sus productos y abrir los detalles disponibles."),
    step("portal-create-property", "Cargá un inmueble", "Abrí el formulario, completá los datos, añadí las fotos y confirmá la creación. Dentro del formulario tenés otra guía con los pasos."),
    step("portal-create-vehicle", "Cargá un vehículo", "Este botón abre el formulario para cargar un vehículo. Completá sus datos y fotos, y confirmá la creación. Dentro del formulario podés abrir la guía de publicación."),
    step("portal-map", "Ubicaciones públicas", "Tocá un marcador para ver el título del inmueble, su tipo y si está en venta o alquiler. Desde su ficha podés abrir la ubicación pública en Google Maps."),
    step("portal-catalog", "Publicaciones disponibles", "Revisá las fotos, los datos y los precios de las publicaciones. Cuando una tarjeta muestre Más detalle, usá ese botón para abrir su ficha."),
    step("portal-products", "Administrá los productos", "Desde Productos gestionás el catálogo de Tienda según tus permisos."),
    step("portal-orders", "Seguí las ventas", "Desde Ventas revisás los pedidos de la empresa y su estado."),
    step("portal-coordinator", "Gestioná las visitas", "Coordinar abre el panel de solicitudes de visita. Revisá cada solicitud y su estado antes de tomar una acción."),
    step("portal-agent-schedule", "Consultá tu agenda", "Coordinar abre tu agenda de visitas y la configuración de disponibilidad."),
    step("portal-cart", "Carrito", "Acá reunís los productos seleccionados y continuás con el pedido. Revisá los datos antes de enviarlo."),
    step(null, "La ayuda queda disponible", "Podés repetir este recorrido desde el botón ? de ayuda. No se guardaron cambios ni se enviaron formularios durante el recorrido."),
  ],
  publication: [
    step(null, "Prepará tu publicación", "Completá el formulario y confirmá la creación. Este recorrido explica los pasos sin modificar tus datos."),
    step("publication-main", "Datos principales", "Indicá el título, precio, moneda y descripción. Completá también los atributos que correspondan al inmueble o al vehículo."),
    step("publication-media", "Fotos de la publicación", "Subí entre 3 y 12 imágenes. La primera será la portada. Revisá las imágenes seleccionadas antes de guardar."),
    step("publication-videos", "Videos de la publicación", "Podés añadir hasta 3 videos de hasta 3 minutos cada uno. Se aceptan MP4, MOV, M4V y WebM, con un máximo de 100 MB por archivo."),
    step("publication-location", "Ubicación del inmueble", "Completá la ubicación y revisá la posición del pin antes de guardar. La ubicación pública y la dirección privada se gestionan por separado."),
    step("publication-submit", "Creá la publicación", "Revisá los datos y pulsá Crear inmueble o Crear vehículo. Al confirmar, la publicación queda visible en el portal. Esperá el mensaje de confirmación."),
  ],
};

// Ignore unavailable features and hidden desktop/mobile copies of the same control.
export function visibleTourSteps(steps, findElements) {
  return steps.flatMap(({ target, title, description }) => {
    const element = target ? findElements(target).find((candidate) => candidate.getClientRects().length && candidate.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) !== false) : undefined;
    return target && !element ? [] : [{ element, popover: { title, description } }];
  });
}

export function contextualTour(tour, features) {
  const words = moduleDictionary(features);
  const requiredModule = {
    "portal-categories": "store", "portal-products": "store", "portal-orders": "store", "portal-cart": "store",
    "portal-create-property": "realEstate", "portal-map": "realEstate", "portal-coordinator": "realEstate", "portal-agent-schedule": "realEstate",
    "portal-create-vehicle": "vehicles",
  };
  return (TOURS[tour] ?? []).filter((item) => !requiredModule[item.target] || features?.[requiredModule[item.target]] === true).map((item) => item.target === "portal-search"
    ? { ...item, title: words.searchTitle, description: words.searchDescription }
    : item);
}
