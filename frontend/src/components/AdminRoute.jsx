/**
 * ============================================
 * COMPONENTE: AdminRoute
 * ============================================
 * Este componente protege rutas que requieren rol ADMIN
 * 
 * ¿Qué hace?
 * - Verifica si el usuario está autenticado ANTES de renderizar
 * - Espera a que termine loading (checkSession del UserContext)
 * - Si NO está autenticado → Redirige a "/"
 * - Si SÍ está autenticado pero NO es admin → Redirige a "/home"
 * - Si SÍ es admin → Muestra el componente
 * 
 * ¿Por qué es necesario?
 * - Evita que usuarios normales entren a páginas administrativas
 * - Centraliza la lógica de protección por rol
 * - Mantiene ProtectedRoute simple (solo login)
 * 
 * ¿Cómo se usa?
 * <Route 
 *   path="/usuarios" 
 *   element={
 *     <AdminRoute>
 *       <Usuarios />
 *     </AdminRoute>
 *   } 
 * />
 */

// ============================================
// IMPORTACIONES
// ============================================

import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// ============================================
// COMPONENTE ADMINROUTE
// ============================================

/**
 * AdminRoute - Wrapper para proteger rutas de admin
 * 
 * @param {Object} props - Props del componente
 * @param {ReactNode} props.children - El componente que queremos proteger
 * 
 * Flujo:
 * 1. Lee user y loading desde el Context
 * 2. Si loading = true → Muestra "Verificando sesión..."
 * 3. Si user = null → Redirige a "/"
 * 4. Si user existe pero role !== "admin" → Redirige a "/home"
 * 5. Si role === "admin" → Renderiza children
 */
function AdminRoute({ children }) {
  // ============================================
  // OBTENER ESTADO DEL USUARIO
  // ============================================
  const { user, loading } = useUser();

  // ============================================
  // CASO 1: Verificando sesión
  // ============================================
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2>Verificando sesión...</h2>
        <p>Por favor espera un momento</p>
      </div>
    );
  }

  // ============================================
  // CASO 2: Usuario NO autenticado
  // ============================================
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ============================================
  // CASO 3: Usuario autenticado pero NO admin
  // ============================================
  /**
   * Nota:
   * - Tu Home normaliza provider/email, pero aquí debemos normalizar role también
   * - Algunos backends devuelven "role", otros "rol"
   * - Si por alguna razón no viene, asumimos que NO es admin
   */
  const role = user.role || user.rol || 'user';

  if (role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  // ============================================
  // CASO 4: Usuario admin ✅
  // ============================================
  return children;
}

export default AdminRoute;
