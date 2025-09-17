import React, { useEffect, useMemo, useState } from "react";
import { getOrders, getOrdersSummary, deleteOrder, updateOrderState, updateOrder, searchProducts2} from "../../services/catalog";
import { formatDateTime } from "../../utils/formatDateTime";
import StateDropdown from "../../components/StateDropDown";
// ======================
// Utils
// ======================
const formatCurrency = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);


const stateColors = {
  Pending: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  Approved: "bg-blue-100 text-blue-800 ring-blue-200",
  Delivered: "bg-green-100 text-green-800 ring-green-200",
  Cancelled: "bg-rose-100 text-rose-800 ring-rose-200",
};
const stateBg = {
  Pending: "border-2 border-yellow-400  hover:bg-yellow-100 ",
  Approved: "border-2 border-blue-400 hover:bg-blue-100 ",
  Delivered: "border-2 border-green-400  hover:bg-green-100 ",
  Cancelled: "border-2 border-rose-400 hover:bg-rose-100 ",
};


// ======================
// Componente principal (100% JS, sin dependencias extras)
// ======================
export default function OrdersDashboard({ initialPageSize = 10, initialSearch = "", initialStateFilter = "" }) {
    // Buscador de productos/variantes
  const [prodQuery, setProdQuery] = useState("");
  const [prodResults, setProdResults] = useState([]);
  const [prodOpen, setProdOpen] = useState(false);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState("");


  // Filtros y paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [stateFilter, setStateFilter] = useState(initialStateFilter);

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null); // { items, page, pageSize, totalCount, totalPages }

  // Modales
  const [selected, setSelected] = useState(null); // para ver detalle
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Edición
  const [editMode, setEditMode] = useState(false);
  const [editModel, setEditModel] = useState(null);
  const [saving, setSaving] = useState(false);
  // Resumen simple (últimos 30 días por defecto)
  const [summary, setSummary] = useState([]);
  const [summaryFrom, setSummaryFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [summaryTo, setSummaryTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Carga de listado (paginado + filtros)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getOrders(page, pageSize, searchTerm, stateFilter);
        if (!cancel) setData(payload);
      } catch (e) {
        if (!cancel) setError(e?.message || "Error al cargar");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [page, pageSize, searchTerm, stateFilter]);

  // Carga de resumen
  const loadSummary = async () => {
    try {
      const fromISO = new Date(summaryFrom).toISOString();
      const toISO = new Date(new Date(summaryTo).setHours(23, 59, 59, 999)).toISOString();
      const s = await getOrdersSummary(fromISO, toISO);
      setSummary(Array.isArray(s) ? s : []);
    } catch {
      setSummary([]);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Construye el payload UpdateOrderDto según tu backend
const buildUpdateDto = (m) => ({
  customerName: m.customerName ?? "",
  // customerEmail: m.customerEmail ?? "",
  customerPhone: m.customerPhone ?? "",
  customerAddress: m.customerAddress ?? "",
  customerObservations: m.customerObservations ?? "",
  paymentMethod: m.paymentMethod ?? "Efectivo",
  paymentAmount: m.paymentAmount !== "" && m.paymentAmount != null ? Number(m.paymentAmount) : null,
  discountAmount: m.discountAmount !== "" && m.discountAmount != null ? Number(m.discountAmount) : null,
  discountPercent: m.discountPercent !== "" && m.discountPercent != null ? Number(m.discountPercent) : null,
  refreshExchangeRate: !!m.refreshExchangeRate,
  exchangeRateOverride: m.exchangeRateOverride !== "" && m.exchangeRateOverride != null ? Number(m.exchangeRateOverride) : null,
  details: (m.details || []).map(d => ({
    id: d.id || 0,
    productVariantId: Number(d.productVariantId),
    quantity: Number(d.quantity),
    note: d.note ?? null,
    // si está vacío/no numérico => null para que el backend recalcule
    unitPriceOverride: d.unitPriceOverride !== "" && d.unitPriceOverride != null
      ? Number(d.unitPriceOverride)
      : null
  }))
});

// Prepara un modelo editable desde `selected`
const makeEditable = (o) => ({
  id: o.id,
  customerName: o.customerName || "",
  // customerEmail: o.customerEmail || "",
  customerPhone: o.customerPhone || "",
  customerAddress: o.customerAddress || "",
  customerObservations: o.customerObservations || "",
  paymentMethod: o.paymentMethod || "Efectivo",
  paymentAmount: o.paymentAmount ?? "",

  discountAmount: o.discountAmount ?? "",
  discountPercent: "",

  refreshExchangeRate: false,
  exchangeRateOverride: "",

  details: (o.details || []).map(d => ({
    id: d.id,                            // <- debe venir en tu DTO
    productVariantId: d.productVariantId, // <- debe venir en tu DTO
    productName: d.productName,
    brandName: d.brandName,
    quantity: d.quantity,
    note: d.note ?? "",
    unitPriceOverride: "" // por defecto vacío: si el user no escribe, el backend recalcula con FX
  }))
});
// lanzar búsqueda
const doProductSearch = async () => {
  const q = (prodQuery || "").trim();
  setProdError(""); setProdLoading(true);
  try {
    const items = await searchProducts2(q);
    setProdResults(items);
    setProdOpen(true);
  } catch (e) {
    setProdError(e?.message || "No se pudo buscar productos");
    setProdResults([]);
    setProdOpen(true);
  } finally {
    setProdLoading(false);
  }
};

// agregar variante seleccionada (Id=0 para que el backend la cree)
const onPickVariant = (product, variant) => {
  if (!editModel) return;
  setEditModel(m => ({
    ...m,
    details: [
      ...(m.details || []),
      {
        id: 0,
        productVariantId: variant.id,
        productName: product.name,
        brandName: product.brandName,
        quantity: 1,
        note: "",
        unitPriceOverride: "" // vacío => que recalculen por FX
      }
    ]
  }));
  setProdOpen(false);
  setProdQuery("");
  setProdResults([]);
};

// cerrar panel al hacer click afuera
const closeProductPanel = () => { setProdOpen(false); };
  // KPIs de la página actual (no de todo el histórico)
  const kpis = useMemo(() => {
    if (!data?.items) return { totalOrders: 0, totalAmount: 0, pending: 0, delivered: 0 };
    const totalOrders = data.totalCount;
    const totalAmount = data.items.reduce((acc, o) => acc + (o.total || 0), 0);
    const pending = data.items.filter((o) => o.state === "Pending").length;
    const delivered = data.items.filter((o) => o.state === "Delivered").length;
    return { totalOrders, totalAmount, pending, delivered };
  }, [data]);

  // Acciones

  const onStartEdit = () => {
  setEditModel(makeEditable(selected));
  setEditMode(true);
  };

  const onCancelEdit = () => {
    setEditMode(false);
    setEditModel(null);
  };

  const onSaveEdit = async () => {
    if (!selected || !editModel) return;
    try {
      setSaving(true);
      const ok = await updateOrder(selected.id, buildUpdateDto(editModel));
      if (!ok) {
        alert("No se actualizaron cambios.");
        return;
      }
      // Refresh listado + resumen y cerrar panel
      const payload = await getOrders(page, pageSize, searchTerm, stateFilter);
      setData(payload);
      await loadSummary();
      setEditMode(false);
      setEditModel(null);
      setSelected(null);
    } catch (e) {
      alert(e?.message || "No se pudo guardar la orden");
    } finally {
      setSaving(false);
    }
  };

  // Detalle: helpers para modificar filas
  const updateRow = (idx, patch) => {
    setEditModel(m => {
      const copy = { ...m, details: [...m.details] };
      copy.details[idx] = { ...copy.details[idx], ...patch };
      return copy;
    });
  };

  const removeRow = (idx) => {
    // regla backend: quantity=0 => eliminar
    updateRow(idx, { quantity: 0 });
  };




  const onChangeState = async (order, newState) => {
    console.log(newState)
    if (!order || order.state === newState) return;
    try {
      await updateOrderState(order.id, newState);
      // Optimistic update
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((it) => (it.id === order.id ? { ...it, state: newState } : it)) }
          : prev
      );
      loadSummary();
    } catch (e) {
      alert(e?.message || "No se pudo actualizar el estado");
    }
  };

  const onDelete = async (order) => {
    if (!order) return;
    try {
      await deleteOrder(order.id);
      // Refrescar la página actual
      const payload = await getOrders(page, pageSize, searchTerm, stateFilter);
      setData(payload);
      loadSummary();
    } catch (e) {
      alert(e?.message || "No se pudo eliminar la orden");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Ventas</h1>
          <p className="text-sm text-gray-500">Listado, KPIs y resumen por estado</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSummary} className="px-3 py-2 rounded-xl border-2 border-amber-400 text-sm hover:bg-gray-50">
            Refrescar resumen
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre, teléfono, email"
          className="border rounded-2xl px-3 py-2 inputRan"
        />
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-2xl px-3 py-2 inputRan"
        >
          <option className="border rounded-lg shadow bg-amber-200" value="">Todos los estados</option>
          <option value="Pending">Pendiente</option>
          <option value="Approved">Aprobado</option>
          <option value="Delivered">Entregado</option>
          <option value="Cancelled">Cancelado</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="inputRan px-3 py-2"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} por página
            </option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Pedidos (página)" value={kpis.totalOrders} />
        <KpiCard title="Monto (página)" value={formatCurrency(kpis.totalAmount)} />
        <KpiCard title="Pendientes" value={kpis.pending} />
        <KpiCard title="Entregados" value={kpis.delivered} />
      </div>

      {/* Resumen por estado (lista simple, sin librerías) */}
      <div className="rounded-2xl  shadow-lg p-4 space-y-3 ring-2 ring-amber-300 border-4 border-white  bg-neutral-100">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <h2 className="font-semibold">Resumen por estado (rango)</h2>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <input type="date" value={summaryFrom} onChange={(e) => setSummaryFrom(e.target.value)} className="border rounded-xl px-2 py-1 inputRan" />
            <span>→</span>
            <input type="date" value={summaryTo} onChange={(e) => setSummaryTo(e.target.value)} className="border rounded-xl px-2 py-1 inputRan" />
            <button onClick={loadSummary} className="w-48 px-3 py-2 mt-4 rounded-xl border text-sm hover:bg-gray-50 btn-custom">Aplicar</button>
          </div>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {summary.map((s, i) => (
            <li key={`${s.state}-${i}`} className={`rounded-2xl p-3 shadow flex items-center justify-between ${stateBg[s.state]} `}>
              <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 ${stateColors[s.state] || "bg-gray-100 text-gray-700 ring-gray-200"}`}>
                <span className="text-xs font-medium">{s.state}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Cantidad</p>
                <p className="font-semibold">{s.count}</p>
              </div>
            </li>
          ))}
          {summary.length === 0 && <li className="text-sm text-gray-500">Sin datos para el rango seleccionado</li>}
        </ul>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl  overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-700 text-white">
              <tr className="text-left">
                <Th>ID</Th>
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th>Teléfono</Th>
                <Th>Estado</Th>
                <Th className="text-right">Total</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="bg-neutral-300">
              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">Cargando...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-rose-600">{error}</td>
                </tr>
              )}
              {!loading && !error && data?.items?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">Sin resultados</td>
                </tr>
              )}
              {data?.items?.map((o) => (
                <tr key={o.id} className="shadow hover:bg-amber-300">
                  <Td>#{o.id}</Td>
                  <Td>{formatDateTime(o.createdAt)}</Td>
                  <Td className="max-w-[220px] truncate">{o.customerName || "—"}</Td>
                  <Td className="max-w-[160px] truncate">{o.customerPhone || "—"}</Td>
                  <Td>
                    <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 ${stateColors[o.state] || "bg-gray-100 text-gray-700 ring-gray-200"}`}>
                      <span className="text-xs font-medium">{o.state}</span>
                    </div>
                  </Td>
                  <Td className="text-right font-semibold">{formatCurrency(o.total)}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelected(o)}
                        className="px-2.5 py-1.5 rounded-xl border text-xs btn-custom hover:bg-gray-50"
                      >
                        Ver
                      </button>
                      <div className="relative group inline-block">
                        <StateDropdown o={o} onChangeState={onChangeState} />
                      </div>
                      <button
                        onClick={() => setConfirmDelete(o)}
                        className="px-2.5 py-1.5 rounded-xl border text-xs hover:bg-rose-50 btn-custom hover:text-rose-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex items-center justify-between p-3 border-t bg-neutral-500">
          <p className="text-xs text-gray-500">
            Página {data?.page ?? page} de {data?.totalPages ?? 1} — {data?.totalCount ?? 0} resultados
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-50 btn-custom"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(data?.page ?? page) <= 1}
            >
              Anterior
            </button>
            <button
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-50 btn-custom"
              onClick={() => setPage((p) => (data?.totalPages ? Math.min(data.totalPages, p + 1) : p + 1))}
              disabled={!!data && data.page >= data.totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Drawer: detalle */}
{selected  && ( 
  <div className="fixed inset-0 z-40">
    <div className="absolute inset-0 bg-black/30" onClick={() => { setSelected(null); setEditMode(false); setEditModel(null); }} />
    <div className="absolute right-0 top-0 h-full w-11/12 sm:w-[620px] bg-neutral-200 rounded-bl-4xl rounded-tl-2xl shadow-xl p-5 overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Orden #{selected.id}</h3>
          <p className="text-sm text-gray-500">{formatDateTime(selected.createdAt)}</p>
          <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 ${stateColors[selected.state] || "bg-gray-100 text-gray-700 ring-gray-200"}`}>
            <span className="text-xs font-medium">{selected.state}</span>
          </div>
        </div>
        <div className="flex gap-2">
            {!editMode ? (
              <button className="px-2.5 py-1.5 rounded-xl border text-xs btn-custom hover:bg-gray-50" onClick={onStartEdit}>
                Editar
              </button>
            ) : (
              <>
                <button disabled={saving} className="px-2.5 py-1.5 rounded-xl border text-xs hover:bg-gray-50 btn-custom" onClick={onSaveEdit}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button className="px-2.5 py-1.5 rounded-xl border text-xs btn-danger" onClick={onCancelEdit}>
                  Cancelar
                </button>
              </>
            )}
          <button className="px-2.5 py-1.5 rounded-xl border text-xs btn-danger" onClick={() => { setSelected(null); setEditMode(false); setEditModel(null); }}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Cabecera: Ver vs Editar */}
      {!editMode ? (
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border p-2 px-4">
            <p className="text-gray-500">Cliente</p>
            <p className="font-medium">{selected.customerName || "—"}</p>
          </div>
          <div className="rounded-xl border p-2 px-4">
            <p className="text-gray-500">Teléfono</p>
            <p className="font-medium">{selected.customerPhone || "—"}</p>
          </div>
          <div className="rounded-xl border p-2 px-4">
            <p className="text-gray-500">Direccion</p>
            <p className="font-medium">{selected.customerAddress || "—"}</p>
          </div>
          <div className="rounded-xl border p-2 px-4 col-span-3">
            <p className="text-gray-500">Observaciones del cliente</p>
            <p className="font-medium">{selected.customerObservations || "—"}</p>
          </div>
          <div className="rounded-xl border p-2 px-4  col-span-2">
            <p className="text-gray-500">Total</p>
            <p className="font-semibold">{formatCurrency(selected.total)}</p>
          </div>
          <div className="rounded-xl bg-neutral-800 border p-2 px-4  col-span-1">
            <p className="text-gray-200">Cotizacion USD</p>
            <p className="font-semibold text-green-400 ">{formatCurrency(selected.exchangeRateAtCreation)}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <label className="rounded-xl border p-2 px-4 flex flex-col">
            <span className="text-gray-500">Cliente</span>
            <input className="" value={editModel.customerName} onChange={e => setEditModel(m => ({...m, customerName: e.target.value}))} />
          </label>
          <label className="rounded-xl border p-2 px-4 flex flex-col">
            <span className="text-gray-500">Teléfono</span>
            <input className="" value={editModel.customerPhone} onChange={e => setEditModel(m => ({...m, customerPhone: e.target.value}))} />
          </label>
          <label className="rounded-xl border p-2 px-4 flex flex-col">
            <span className="text-gray-500">Dirección</span>
            <input className="" value={editModel.customerAddress} onChange={e => setEditModel(m => ({...m, customerAddress: e.target.value}))} />
          </label>
          {/* <label className="rounded-xl border p-2 px-4 flex flex-col col-span-3">
            <span className="text-gray-500">Email</span>
            <input className="" value={editModel.customerEmail} onChange={e => setEditModel(m => ({...m, customerEmail: e.target.value}))} />
          </label> */}
          <label className="rounded-xl border p-2 px-4 flex flex-col col-span-3">
            <span className="text-gray-500">Observaciones</span>
            <textarea className="" rows={2} value={editModel.customerObservations} onChange={e => setEditModel(m => ({...m, customerObservations: e.target.value}))} />
          </label>
          <label className="rounded-xl border p-2 px-4 flex flex-col">
            <span className="text-gray-500">Método de pago</span>
            <input className="" value={editModel.paymentMethod} onChange={e => setEditModel(m => ({...m, paymentMethod: e.target.value}))} />
          </label>
          <label className="rounded-xl border p-2 px-4 flex flex-col">
            <span className="text-gray-500">Monto pagado (ARS)</span>
            <input type="number" step="0.01" className="" value={editModel.paymentAmount} onChange={e => setEditModel(m => ({...m, paymentAmount: e.target.value}))} />
          </label>
          <div className="rounded-xl border p-2 px-4 col-span-1">
            <div className="flex items-center gap-2">
              <input id="fxrefresh" type="checkbox" checked={!!editModel.refreshExchangeRate} onChange={e => setEditModel(m => ({...m, refreshExchangeRate: e.target.checked}))} />
              <label htmlFor="fxrefresh" className="text-xs">Refrescar cotización</label>
            </div>
            <label className="mt-2 block">
              <span className="text-gray-500 text-xs">cotizacion personalizada</span>
              <input type="number" step="0.01" className="" value={editModel.exchangeRateOverride} onChange={e => setEditModel(m => ({...m, exchangeRateOverride: e.target.value}))} />
            </label>
          </div>
          <label className="rounded-xl border p-2 px-4 flex flex-col">
            <span className="text-gray-500">Descuento (ARS)</span>
            <input type="number" step="0.01" className="" value={editModel.discountAmount} onChange={e => setEditModel(m => ({...m, discountAmount: e.target.value, discountPercent: ""}))} />
          </label>
          <label className="rounded-xl border p-2 px-4 flex flex-col">
            <span className="text-gray-500">Descuento (%)</span>
            <input type="number" step="0.01" className="" value={editModel.discountPercent} onChange={e => setEditModel(m => ({...m, discountPercent: e.target.value, discountAmount: ""}))} />
          </label>
        </div>
      )}

      {/* Detalle */}
      {!editMode ? (
        <>
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Detalle</h4>
            <div className="rounded-xl border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <Th>Producto</Th>
                    <Th>Marca</Th>
                    <Th className="text-right">Cant.</Th>
                    <Th className="text-right">P. Unit.</Th>
                    <Th className="text-right">Subtotal</Th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.details || []).map((d, idx) => (
                    <tr key={idx} className="border-t">
                      <Td className="max-w-[260px] truncate">{d.productName}</Td>
                      <Td className="max-w-[260px] truncate">{d.brandName}</Td>
                      <Td className="text-right">{d.quantity}</Td>
                      <Td className="text-right">{formatCurrency(d.unitPrice)}</Td>
                      <Td className="text-right font-medium">{formatCurrency(d.totalPrice)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
       ) : (
  <>
    <div className="mt-6">
      <h4 className="font-semibold mb-2">Detalle (editable)</h4>
      <div className="rounded-xl border overflow-x-auto">
        <table className="text-sm w-max min-w-[900px]">
          <thead className="bg-gray-50 text-left whitespace-nowrap">
            <tr>
              <Th>Producto</Th>
              <Th>Marca</Th>
              <Th className="text-right">Cant.</Th>
              <Th className="text-right">UnitPrice Override</Th>
              <Th>Nota</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {(editModel?.details ?? []).map((d, idx) => (
              <tr key={idx} className={`border-t ${Number(d.quantity) === 0 ? "opacity-50 line-through" : ""}`}>
                <Td className="max-w-[220px] truncate">{d.productName || `#${d.productVariantId}`}</Td>
                <Td className="max-w-[200px] truncate">{d.brandName || "—"}</Td>
                <Td className="text-right">
                  <input
                    type="number"
                    min="0"
                    className="inputRan w-20 text-right"
                    value={d.quantity ?? 0}
                    onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                  />
                </Td>
                <Td className="text-right">
                  <input
                    type="number"
                    step="0.01"
                    className="inputRan w-28 text-right"
                    placeholder="(auto)"
                    value={d.unitPriceOverride ?? ""}
                    onChange={(e) => updateRow(idx, { unitPriceOverride: e.target.value })}
                  />
                </Td>
                <Td>
                  <input
                    className="inputRan w-full"
                    value={d.note ?? ""}
                    onChange={(e) => updateRow(idx, { note: e.target.value })}
                  />
                </Td>
                <Td className="text-right">
                  <button
                    className="px-2 py-1 rounded-lg border text-xs hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => removeRow(idx)}
                  >
                    Quitar
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Buscar y agregar producto/variante */}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Agregar ítem</h4>

        <div className="relative">
          <div className="rounded-xl border p-2 grid grid-cols-5 gap-3 items-end bg-white">
              <label className="col-span-4 text-xs mb-2">
              <span className="text-gray-500">Buscar producto</span>
              <input
                className="inputRan w-full"
                placeholder="Ej: Nokia 2660, A15, Dell Pro…"
                value={prodQuery ?? ""}
                onChange={(e) => setProdQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doProductSearch();
                }}
              />
            </label>
            <div className="col-span-1 flex justify-end">
              <button
                className="px-3 py-2 rounded-xl border text-sm btn-custom hover:bg-gray-50 w-full"
                onClick={doProductSearch}
                disabled={!!prodLoading}
                aria-label="Buscar productos"
              >
                {prodLoading ? "Buscando…" : "Buscar"}
              </button>
            </div>
          </div>

          {/* Panel de resultados */}
          {prodOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeProductPanel} />
              <div className="absolute z-50 mt-2 w-full rounded-2xl border shadow-xl bg-neutral-50">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <p className="text-sm font-medium">
                    Resultados {prodLoading ? "(cargando…)" : `(${(prodResults ?? []).length})`}
                  </p>
                  <button className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-100" onClick={closeProductPanel}>
                    Cerrar
                  </button>
                </div>

                {prodError && <p className="p-3 text-sm text-rose-600">{prodError}</p>}

                <div className="max-h-[380px] overflow-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(prodResults ?? []).map((p) => {
                    const firstImg = p?.variants?.[0]?.images?.[0]?.url;
                    return (
                      <div key={p.id} className="rounded-xl border bg-white overflow-hidden hover:shadow transition">
                        <div className="flex gap-3 p-3">
                          <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {firstImg ? (
                              <img src={firstImg} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full grid place-content-center text-gray-400 text-xs">Sin img</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">{p.brandName || "—"}</p>
                            <p className="text-sm font-medium truncate" title={p.name}>
                              {p.name}
                            </p>
                          </div>
                        </div>

                        <div className="border-t bg-neutral-50 p-2">
                          {(!p.variants || p.variants.length === 0) && (
                            <p className="text-xs text-gray-500 px-2 py-1">Sin variantes disponibles</p>
                          )}
                          <ul className="space-y-1">
                            {(p.variants ?? []).map((v) => (
                              <li
                                key={v.id}
                                className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg hover:bg-neutral-100"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-700 truncate" title={v.sku}>
                                    {v.sku}
                                  </p>
                                  {typeof v.price === "number" && (
                                    <p className="text-[11px] text-gray-500">Base: {formatCurrency(v.price)}</p>
                                  )}
                                </div>
                                <button
                                  className="px-2 py-1 rounded-lg border text-xs hover:bg-gray-50"
                                  onClick={() => onPickVariant(p, v)}
                                  aria-label={`Agregar variante ${v.id}`}
                                >
                                  Agregar
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}

                  {!prodLoading && (prodResults ?? []).length === 0 && !prodError && (
                    <div className="col-span-full text-sm text-gray-500 px-1 py-2">No se encontraron productos.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
    )
    }

      {/* Acciones de estado + eliminar (se mantienen) */}
      {!editMode && (
        <div className="mt-6 flex-col items-end justify-end">
          <div className="flex gap-2">
            {["Pending", "Approved", "Delivered", "Cancelled"].map((st) => (
              <button
                key={st}
                className={`px-3 py-1.5 rounded-xl border text-xs ${st === selected.state ? "bg-gray-50" : "hover:bg-gray-50"}`}
                onClick={() => onChangeState(selected, st)}
              >
                {st}
              </button>
            ))}
          </div>
          <button
            className="mt-3 px-3 py-1.5 rounded-xl border text-xs hover:bg-rose-50 btn-danger"
            onClick={() => setConfirmDelete(selected)}
          >
            Eliminar orden
          </button>
        </div>
      )}
    </div>
  </div>
)}

      {/* Confirmación de borrado */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDelete(null)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[460px] bg-white rounded-2xl shadow-xl p-5">
            <h3 className="text-lg font-semibold">Eliminar orden #{confirmDelete.id}</h3>
            <p className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer. ¿Deseás continuar?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-xl border text-sm" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button className="px-3 py-1.5 rounded-xl border text-sm hover:bg-rose-50 hover:text-rose-600" onClick={() => onDelete(confirmDelete)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================
// Presentacionales chicos
// ======================
function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-xs font-medium uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
function KpiCard({ title, value }) {
  return (
    <div className="border p-4 panel-custom ">
      <p className="text-xs text-gray-500 ">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
