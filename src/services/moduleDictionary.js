export const MODULE_DICTIONARY = Object.freeze({
  store: { plural: "productos", searchPlaceholder: "Buscar productos…", searchTitle: "Buscá productos", searchDescription: "Escribí el nombre de un producto para buscarlo en la tienda.", empty: "No se encontraron productos." },
  realEstate: { plural: "inmuebles", searchPlaceholder: "Buscar inmuebles…", searchTitle: "Buscá inmuebles", searchDescription: "Escribí una palabra del título o la descripción del inmueble para buscar entre las publicaciones.", empty: "No se encontraron inmuebles." },
  vehicles: { plural: "vehículos", searchPlaceholder: "Buscar vehículos…", searchTitle: "Buscá vehículos", searchDescription: "Escribí una palabra del título o la descripción del vehículo para buscar entre las publicaciones.", empty: "No se encontraron vehículos." },
});
export function searchableModules(features = {}) {
  return Object.keys(MODULE_DICTIONARY).filter((key) => {
    const component = { store: "storeCatalog", realEstate: "realEstateCatalog", vehicles: "vehicleCatalog" }[key];
    return features[key] === true && features.components?.[component] !== false;
  });
}
export function moduleDictionary(features = {}) {
  const modules = searchableModules(features);
  if (modules.length === 1) return MODULE_DICTIONARY[modules[0]];
  const names = modules.map((key) => MODULE_DICTIONARY[key].plural);
  const listing = names.length > 1 ? names.slice(0, -1).join(", ") + " y " + names.at(-1) : "";
  return {
    plural: listing || "resultados",
    searchPlaceholder: listing ? `Buscar ${listing}…` : "Buscar…",
    searchTitle: "Buscá en este portal",
    searchDescription: listing ? `Escribí qué buscás para consultar ${listing} disponibles en este portal.` : "La búsqueda estará disponible cuando se habiliten publicaciones.",
    empty: "No se encontraron resultados.",
  };
}
export function matchesPublication(item, query) {
  const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  return normalize(`${item.title ?? ""} ${item.description ?? ""}`).includes(normalize(query.trim()));
}
