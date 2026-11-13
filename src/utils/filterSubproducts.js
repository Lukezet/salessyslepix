const searchable = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function filterSubproducts(items, group = "all", search = "") {
  const terms = searchable(search).trim().split(/\s+/).filter(Boolean);
  return items.filter(item => !item.isDisabled
    && (group === "all" || (group === "none" ? item.ingredientGroupId == null : Number(item.ingredientGroupId) === Number(group)))
    && terms.every(term => searchable(`${item.name} ${item.sku ?? ""}`).includes(term)));
}
