import { Link } from "react-router-dom";
import { categories } from "../data/mock";

export default function Home() {
  return (
    <section className="w-full" >
      <h1 className="text-2xl font-semibold mb-4">Categorías</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c) => (
    <Link to={`/category/${c.id}`} key={c.id} className="group rounded-xl overflow-hidden  hover:shadow transition-shadow">
      <div className="relative h-36 md:h-44 bg-neutral-100">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${c.image})` }}
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20  transition-colors " />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white drop-shadow">
          <div className="font-medium">{c.name}</div>
          <div className="text-xs opacity-90">{c.slug}</div>
        </div>
      </div>
    </Link>
        ))}
      </div>
    </section>
  );
}