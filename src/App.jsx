import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div className="min-h-dvh w-full flex flex-col bg-white">
      <Navbar />
      <main className="py-6 flex-1">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="container py-6 text-sm text-neutral-600">© {new Date().getFullYear()} Lepix</div>
      </footer>
    </div>
  );
}