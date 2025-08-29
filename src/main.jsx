import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout";
import AdminPage from "./pages/Admin/AdminPage";
import OrdersDashboard from "./pages/Admin/OrderDashboard";
import SearchPage from "./pages/SearchPage";

import RequireAuth from "./components/auth/RequireAuth";
import RequireRole from "./components/auth/RequireRole";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
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
    </Routes>
  </BrowserRouter>
);
