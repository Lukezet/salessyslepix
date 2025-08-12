import { Link, useParams,useNavigate } from "react-router-dom";
import { products, categories } from "../data/mock";
import { formatPrice } from "../utils/format";
import AddButton from "../components/Addbutton";

export default function CategoryPage() {
   const navigate = useNavigate();
  const { id } = useParams();
  const cid = Number(id);
  const cat = categories.find((c) => c.id === cid);
  const list = products.filter((p) => p.categoryId === cid);

  if (!cat) return <p>Categoría no encontrada.</p>;

  return (
    <section className="">
      <button
        onClick={() => navigate(-1)}
        className="fixed flex justify-center items-center opacity-50 hover:opacity-100 top-18 right-4 w-10 h-10  btn-custom z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>

      </button>
      <h1 className="text-2xl font-semibold mb-4">{cat.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4  ">
        {list.map((p) => (
          <Link key={p.id} to={`/product/${p.id}`} className="relative h-36 md:h-44  rounded-lg p-4 hover:shadow-lg shadow-neutral-700 transition duration-150 ease-out">
            <div
              className="absolute inset-0 bg-center bg-cover rounded-lg"
              style={{ backgroundImage: `url(${p.images[0]})` }}
            />
            <div className="absolute flex w-full justify-between bg-neutral-100/50 bottom-0 left-0 right-0 p-3  drop-shadow rounded-t-3xl rounded-b-lg">
              
              <div>
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-sm">{formatPrice(p.price)}</div>
              </div>
              <AddButton product={p} />
            </div>

          </Link>
        ))}
      </div>
    </section>
  );
}