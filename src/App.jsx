import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  console.log('App component rendered');
  return (
    <div className="min-h-dvh w-full flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 mx-4 mt-4 ">
        <Outlet />
      </main>
      <footer className=" bg-neutral-800 rounded-t-3xl">
        <div className="container py-6 text-sm text-neutral-400 font-semibold pl-4">© {new Date().getFullYear()} Lepix</div>
      </footer>
    </div>
  );
}