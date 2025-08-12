import { useParams,useNavigate } from "react-router-dom";
import { products } from "../data/mock";
import { formatPrice } from "../utils/format";
import ImageSlider from "../components/ImageSlider";
import AddButton from "../components/Addbutton";

export default function ProductDetail() {
 const navigate = useNavigate();
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id));

  if (!product) return <p>Producto no encontrado.</p>;


  return (
    <article className="relative grid md:grid-cols-2 gap-6">
      <button
        onClick={() => navigate(-1)}
        className="fixed flex justify-center items-center opacity-50 hover:opacity-100 bottom-20 left-4 w-10 h-10  btn-custom z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>

      </button>
      <div>
        <ImageSlider images={product.images} alt={product.name} />
      </div>
      <div className="mx-4">
        <h1 className="text-2xl font-semibold mb-4">{product.name}</h1>
        <div className="text-2xl mb-4">{formatPrice(product.price)}</div>

        <div className="w-full flex items-center justify-between bg-neutral-200 h-24 shadow-xl rounded-2xl pr-4 pb-3">
          <div className="mt-3 ml-3">      
            <p className="mb-2 text-neutral-700">
              Marca: <span className="text-xl font-semibold">{product.nameBrand}</span>
            </p>
            <p className="mb-4 text-neutral-700">{product.description}</p>
            </div>
        <div className="flex flex-col  justify-center items-end">
          <label htmlFor="AddButton" className="text-xs">Agregar al carrito</label>
          <AddButton product={product} />
        </div>

        </div>
        
        
      </div>
    </article>
  );
}