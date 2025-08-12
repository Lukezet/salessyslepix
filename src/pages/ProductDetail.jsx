import { useParams } from "react-router-dom";
import { products } from "../data/mock";
import { useCart } from "../store/cart";
import { useState } from "react";
import { formatPrice } from "../utils/format";
import ImageSlider from "../components/ImageSlider";

export default function ProductDetail() {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id));
  const add = useCart((s) => s.add);
  const [isAdding, setIsAdding] = useState(false); // anti-doble click

  if (!product) return <p>Producto no encontrado.</p>;

  const handleAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    add(product, 1);
    setTimeout(() => setIsAdding(false), 500); // ventana de bloqueo breve
  };

  return (
    <article className="grid md:grid-cols-2 gap-6">
      <div>
        <ImageSlider images={product.images} alt={product.name} />
      </div>
      <div className="mx-4">
        <h1 className="text-2xl font-semibold mb-4">{product.name}</h1>
        <div className="text-2xl mb-4">{formatPrice(product.price)}</div>
        <p className="mb-2 text-neutral-700">
          Marca: <span className="text-xl font-semibold">{product.nameBrand}</span>
        </p>
        <p className="mb-6 text-neutral-700">{product.description}</p>
        <button
          className="px-4 py-2 rounded-xl  hover:shadow disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          onClick={handleAdd}
          disabled={isAdding}
        >
          {isAdding ? "Agregando..." : "Agregar al carrito"}
        </button>
      </div>
    </article>
  );
}