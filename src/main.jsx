import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
const Home = lazy(() => import("./pages/Home"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CartPage = lazy(() => import("./pages/CartPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AdminPage = lazy(() => import("./pages/Admin/AdminPage"));
const OrdersDashboard = lazy(() => import("./pages/Admin/OrderDashboard"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

import RequireAuth from "./components/auth/RequireAuth";
import RequireRole from "./components/auth/RequireRole";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-slate-950 text-slate-100" aria-busy="true">Cargando…</main>}>
      <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="category/:id" element={<CategoryPage />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="/search" element={<SearchPage />} />
        {/* Protegidas: Admin + Employee */}
        <Route
          path="admin"
          element={
            <RequireAuth>
              <RequireRole allowed={["Admin", "Employee"]}>
                <AdminPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="ordersDashboard"
          element={
            <RequireAuth>
              <RequireRole allowed={["Admin", "Employee"]}>
                <OrdersDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
      </Route>
      <Route path=":clientSlug" element={<App />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="category/:id" element={<CategoryPage />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route
          path="admin"
          element={
            <RequireAuth>
              <RequireRole allowed={["Admin", "Employee"]}>
                <AdminPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="ordersDashboard"
          element={
            <RequireAuth>
              <RequireRole allowed={["Admin", "Employee"]}>
                <OrdersDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
      </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>,
);
