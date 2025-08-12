import { Link, useParams } from "react-router-dom";
import { products, categories } from "../data/mock";
import { formatPrice } from "../utils/format";
import AddButton from "../components/Addbutton";

export default function CategoryPage() {
  const { id } = useParams();
  const cid = Number(id);
  const cat = categories.find((c) => c.id === cid);
  const list = products.filter((p) => p.categoryId === cid);

  if (!cat) return <p>Categoría no encontrada.</p>;

  return (
    <section className="mx-4">
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