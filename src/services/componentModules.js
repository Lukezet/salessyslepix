export const MODULES = [
  { key: "store", label: "Tienda", detail: "Productos y pedidos." },
  { key: "realEstate", label: "Inmuebles", detail: "Publicaciones y visitas." },
  { key: "vehicles", label: "Vehículos", detail: "Catálogo automotor." },
];

export const INDEPENDENT_BLOCKS = [
  { key: "storeCategories", label: "Categorías", categories: ["store"] },
  { key: "storeCatalog", label: "Catálogo de productos", categories: ["store"] },
  { key: "storeDetails", label: "Detalle de producto", categories: ["store"] },
  { key: "storeCart", label: "Carrito y checkout", categories: ["store"] },
  { key: "realEstateMap", label: "Mapa", categories: ["realEstate"], prerequisite: "interactiveMap" },
  { key: "realEstateCatalog", label: "Catálogo de inmuebles", categories: ["realEstate"] },
  { key: "realEstateDetails", label: "Detalle de inmueble", categories: ["realEstate"] },
  { key: "realEstateAppointments", label: "Coordinar visita", categories: ["realEstate"], prerequisite: "appointments" },
  { key: "vehicleCatalog", label: "Catálogo de vehículos", categories: ["vehicles"] },
  { key: "vehicleDetails", label: "Detalle de vehículo", categories: ["vehicles"] },
  { key: "dollarQuote", label: "Precio de USD", detail: "Cotización reutilizable en cualquier categoría." },
  { key: "videos", label: "Videos", detail: "Subida y reproducción de videos en el detalle." },
];

export const placementKey = (block, category) => `placement:${block}:${category}`;

// Keep this merge in sync with ModuleDefaultsService.Resolve on the API.
export function resolveModuleComponents(defaults = {}, overrides = {}) {
  const own = overrides ?? {};
  const result = { ...defaults, ...own };
  for (const key of ["videos", "dollarQuote"]) {
    if (own[key] !== false && MODULES.some((module) => result[placementKey(key, module.key)] === true)) result[key] = true;
  }
  return result;
}

export function generalModuleFeatures(defaults = {}) {
  return {
    store: true, realEstate: true, vehicles: true, interactiveMap: true, appointments: true,
    components: resolveModuleComponents({
      dollarQuote: true,
      [placementKey("dollarQuote", "store")]: true,
      [placementKey("dollarQuote", "realEstate")]: false,
      [placementKey("dollarQuote", "vehicles")]: false,
    }, defaults),
  };
}

export function editModuleOverride(source, key, category, value) {
  const block = INDEPENDENT_BLOCKS.find((item) => item.key === key);
  if (!supportsCategory(block, category)) throw new Error("Este módulo no es compatible con la categoría elegida.");
  const result = { ...source };
  if (block.categories) result[key] = value;
  else {
    // Older configurations used one switch for every category. Convert that explicit
    // choice before editing a single category; never copy unrelated inherited values.
    if (Object.hasOwn(result, key)) {
      const hasPlacements = MODULES.some((module) => Object.hasOwn(result, placementKey(key, module.key)));
      MODULES.forEach((module) => {
        const placement = placementKey(key, module.key);
        result[placement] = result[key] === true && (!hasPlacements || result[placement] === true);
      });
      delete result[key];
    }
    result[placementKey(key, category)] = value;
  }
  return result;
}

export function resetModuleOverrides(source = {}) {
  const result = { ...source };
  INDEPENDENT_BLOCKS.forEach(({ key }) => {
    delete result[key];
    MODULES.forEach((module) => { delete result[placementKey(key, module.key)]; });
  });
  return result;
}

export function supportsCategory(block, category) {
  return MODULES.some(({ key }) => key === category) &&
    Boolean(block && (!block.categories || block.categories.includes(category)));
}

export function moduleAssigned(features, key, category) {
  const block = INDEPENDENT_BLOCKS.find((item) => item.key === key);
  if (!supportsCategory(block, category)) return false;
  if (!block.categories) return Boolean(features?.components?.[key] ?? (key === "dollarQuote" && features?.store)) && assignedTo(features, key, category);
  return Boolean(features?.components?.[key] ?? (features?.[category] && (!block.prerequisite || features?.[block.prerequisite])));
}

export function changeModuleAssignment(features, key, category, value) {
  const block = INDEPENDENT_BLOCKS.find((item) => item.key === key);
  if (!supportsCategory(block, category)) throw new Error("Este módulo no es compatible con la categoría elegida.");
  if (value && !features?.[category]) throw new Error("Primero habilitá la categoría en la empresa.");
  if (moduleAssigned(features, key, category) === value) throw new Error(value ? "Este módulo ya existe en la categoría." : "Este módulo ya fue quitado de la categoría.");
  const next = { ...features, components: { ...features?.components } };
  if (block.categories) {
    next.components[key] = value;
    if (value && block.prerequisite) next[block.prerequisite] = true;
  } else {
    MODULES.forEach((module) => { next.components[placementKey(key, module.key)] = moduleAssigned(features, key, module.key); });
    next.components[placementKey(key, category)] = value;
    next.components[key] = MODULES.some((module) => next.components[placementKey(key, module.key)]);
  }
  return next;
}

export function assignedTo(features, block, category) {
  const components = features?.components ?? {};
  const hasAssignments = MODULES.some(({ key }) => Object.hasOwn(components, placementKey(block, key)));
  if (hasAssignments) return components[placementKey(block, category)] === true;
  // Preserve the quotation shown by older configurations until explicitly assigned.
  return block === "dollarQuote" && Boolean(components.dollarQuote ?? features?.store);
}

export function independentBlockEnabled(features, block, category) {
  return Boolean(features?.[category]) &&
    Boolean(features?.components?.[block] ?? (block === "dollarQuote" && features?.store)) &&
    assignedTo(features, block, category);
}
