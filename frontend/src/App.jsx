/**
 * ============================================
 * COMPONENTE PRINCIPAL: App
 * ============================================
 */

import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { UserProvider } from "./context/UserContext";

import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import Ordenes from "./pages/Ordenes";
import Usuarios from "./pages/Usuarios";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* 
            Página principal.
            Home decide qué mostrar según:
            - loading
            - user
          */}
          <Route path="/" element={<Home />} />

          {/* Callback de OAuth (Google redirige aquí) */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth-callback" element={<AuthCallback />} />

          {/* =========================
              RUTAS PROTEGIDAS
              ========================= */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ordenes"
            element={
              <ProtectedRoute>
                <Ordenes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <AdminRoute>
                <Usuarios />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
