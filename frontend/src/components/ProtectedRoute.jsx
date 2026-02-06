/**
 * ============================================
 * COMPONENTE: ProtectedRoute
 * ============================================
 * Este componente protege rutas que requieren autenticación
 * 
 * ¿Qué hace?
 * - Verifica si el usuario está autenticado ANTES de renderizar
 * - Si NO está autenticado → Redirige al login
 * - Si SÍ está autenticado → Muestra el componente
 * 
 * ¿Por qué es necesario?
 * - Evita que usuarios no autenticados vean páginas protegidas
 * - Previene el "flicker" (mostrar contenido y luego redirigir)
 * - Centraliza la lógica de protección de rutas
 * 
 * ¿Cómo se usa?
 * <Route 
 *   path="/home" 
 *   element={
 *     <ProtectedRoute>
 *       <Home />
 *     </ProtectedRoute>
 *   } 
 * />
 */

// ============================================
// IMPORTACIONES
// ============================================

import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// ============================================
// COMPONENTE PROTECTEDROUTE
// ============================================

/**
 * ProtectedRoute - Wrapper para proteger rutas
 * 
 * @param {Object} props - Props del componente
 * @param {ReactNode} props.children - El componente que queremos proteger
 * 
 * Flujo:
 * 1. Lee el estado del usuario desde el Context
 * 2. Si loading = true → Muestra "Cargando..."
 * 3. Si user = null → Redirige a "/"
 * 4. Si user existe → Renderiza children (el componente protegido)
 */
function ProtectedRoute({ children }) {
  // ============================================
  // OBTENER ESTADO DEL USUARIO
  // ============================================
  
  /**
   * useUser() - Hook del Context
   * 
   * Obtenemos:
   * - user: Objeto del usuario autenticado (o null)
   * - loading: Boolean que indica si estamos verificando la sesión
   * 
   * Estados posibles:
   * 1. loading = true, user = null → Verificando sesión...
   * 2. loading = false, user = {...} → Usuario autenticado ✅
   * 3. loading = false, user = null → No autenticado ❌
   */
  const { user, loading } = useUser();
  
  // ============================================
  // CASO 1: Verificando sesión
  // ============================================
  
  /**
   * Mientras loading = true
   * 
   * ¿Cuándo pasa?
   * - Al cargar la aplicación por primera vez
   * - UserContext está llamando getCurrentUser()
   * - Esperando respuesta del backend
   * 
   * ¿Por qué es importante?
   * - Evita redirigir prematuramente
   * - Si redirigimos mientras loading = true:
   *   1. App carga → loading = true, user = null
   *   2. ProtectedRoute ve user = null → Redirige a login ❌
   *   3. getCurrentUser() termina → user = {...}
   *   4. Pero ya redirigimos al usuario innecesariamente
   * 
   * Con esta validación:
   * - Esperamos a que termine de verificar
   * - Luego decidimos si redirigir o no
   */
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
  
  /**
   * Si loading = false y user = null
   * 
   * ¿Qué significa?
   * - Ya terminamos de verificar la sesión
   * - No hay usuario autenticado
   * - No hay cookie válida o expiró
   * 
   * ¿Qué hacemos?
   * - Redirigimos al login con <Navigate />
   * 
   * <Navigate to="/" replace />
   * 
   * ¿Qué es Navigate?
   * - Componente de React Router para redirigir
   * - Es como useNavigate() pero en forma de componente
   * - Se puede usar en el return (useNavigate NO)
   * 
   * ¿Qué hace 'replace'?
   * - Reemplaza la entrada actual del historial
   * - Sin replace: / → /home → / (3 entradas)
   * - Con replace: / → / (1 entrada)
   * - Evita que el botón "Atrás" lleve a /home
   * 
   * Ejemplo sin replace:
   * 1. Usuario en login (/)
   * 2. Intenta ir a /home
   * 3. Es redirigido a /
   * 4. Presiona "Atrás" → Vuelve a /home → Redirigido a / (loop)
   * 
   * Con replace:
   * 1. Usuario en login (/)
   * 2. Intenta ir a /home
   * 3. Es redirigido a / (reemplaza /home)
   * 4. Presiona "Atrás" → Va a la página anterior al login
   */
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // ============================================
  // CASO 3: Usuario autenticado ✅
  // ============================================
  
  /**
   * Si llegamos aquí:
   * - loading = false (ya verificamos)
   * - user = {...} (hay usuario autenticado)
   * 
   * ¿Qué hacemos?
   * - Renderizamos children
   * - children es el componente que protegemos (<Home />)
   * 
   * Flujo:
   * <ProtectedRoute>
   *   <Home />
   * </ProtectedRoute>
   * 
   * children = <Home />
   * return children → Renderiza <Home />
   * 
   * ¿Por qué return children?
   * - Queremos que ProtectedRoute sea "invisible"
   * - Solo verifica, no agrega nada visual
   * - El usuario ve <Home /> directamente
   */
  return children;
}

export default ProtectedRoute;

/**
 * ============================================
 * RESUMEN DE CASOS
 * ============================================
 * 
 * Estado                  | Resultado
 * ----------------------- | ---------------------------------
 * loading = true          | Muestra "Verificando sesión..."
 * loading = false, !user  | Redirige a "/" (login)
 * loading = false, user   | Muestra children (componente protegido)
 * 
 * ============================================
 * VENTAJAS
 * ============================================
 * 
 * ✅ Previene acceso no autorizado
 * ✅ Evita flicker visual
 * ✅ No renderiza el componente si no hay acceso
 * ✅ Reutilizable para múltiples rutas
 * ✅ Experiencia de usuario mejorada
 * 
 * ============================================
 * IMPORTANTE
 * ============================================
 * 
 * ⚠️  Esta protección es solo para UX (experiencia de usuario)
 * ⚠️  NO reemplaza la seguridad del backend
 * ⚠️  El backend DEBE validar con authMiddleware
 * ⚠️  Un usuario técnico puede bypassear esto
 * ⚠️  La protección REAL está en el servidor
 * 
 * Piensa en esto como:
 * - Frontend = Puerta del edificio (hace que sea difícil entrar sin llave)
 * - Backend = Caja fuerte (la protección verdadera)
 */
