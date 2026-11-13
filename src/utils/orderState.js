export const ORDER_STATE_LABELS = Object.freeze({
  Pending: "Pendiente",
  Approved: "Aprobado",
  Delivered: "Entregado",
  Cancelled: "Cancelado",
});

export const orderStateLabel = (state) => ORDER_STATE_LABELS[state] ?? "Estado desconocido";
