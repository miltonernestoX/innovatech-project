/**
 * ============================================
 * CONTEXT: UserContext
 * ============================================
 * Este archivo crea un "almacén global" para los datos del usuario
 * 
 * ¿Qué es Context API?
 * - Un almacén de datos compartido entre TODOS los componentes
 * - Como una variable global, pero mejor organizada
 * - Evita pasar props manualmente entre componentes
 * 
 * ¿Cuándo usarlo?
 * - Datos que MUCHOS componentes necesitan
 * - Ejemplos: usuario autenticado, tema (dark/light), idioma
 * 
 * Analogía:
 * - Context = Google Drive
 * - Cualquier componente puede leer/escribir datos
 * - No necesitas pasar archivos (props) manualmente
 */

// ============================================
// IMPORTACIONES
// ============================================

import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser } from '../api/auth'

/**
 * createContext:
 * - Crea el "almacén" (Context)
 * - Similar a crear una carpeta en Google Drive
 * 
 * useContext:
 * - Hook para LEER datos del Context
 * - Como abrir Google Drive y descargar un archivo
 * 
 * useState:
 * - Para guardar el usuario en este componente
 * - El estado se compartirá con TODOS los componentes hijos
 * 
 * useEffect:
 * - Hook para ejecutar código cuando el componente se monta
 * - Lo usaremos para verificar si hay sesión activa al cargar
 * 
 * getCurrentUser:
 * - Función de auth.js que consulta al backend
 * - Verifica si existe una sesión activa (cookie)
 * - Retorna el usuario si hay sesión, null si no hay
 */

// ============================================
// CREAR EL CONTEXT
// ============================================

/**
 * UserContext - El almacén de datos
 * 
 * ¿Qué es?
 * - Un objeto especial de React
 * - Almacena datos que pueden compartirse
 * 
 * ¿Qué guarda?
 * - user: El objeto del usuario autenticado
 * - setUser: Función para actualizar el usuario
 * 
 * Analogía:
 * - UserContext = La carpeta "Usuarios" en Google Drive
 * - Dentro hay un archivo: "usuario-actual.json"
 */
const UserContext = createContext();

// ============================================
// PROVIDER - El que PROVEE los datos
// ============================================

/**
 * UserProvider - Componente que envuelve la app
 * 
 * ¿Qué hace?
 * - Guarda el usuario en un estado
 * - Comparte ese estado con TODOS los componentes hijos
 * 
 * ¿Cómo funciona?
 * - Envuelve tu app: <UserProvider><App /></UserProvider>
 * - Todos los componentes dentro pueden acceder al usuario
 * 
 * Analogía:
 * - UserProvider = El servidor de Google Drive
 * - children = Todos los que tienen acceso a Google Drive
 * 
 * @param {Object} props - Las props del componente
 * @param {ReactNode} props.children - Los componentes hijos
 */
export function UserProvider({ children }) {
  // ============================================
  // ESTADOS
  // ============================================
  
  /**
   * user - Estado que guarda los datos del usuario
   * 
   * Valores posibles:
   * - null: No hay usuario autenticado
   * - { id: 1, nombre: "Juan", correo: "juan@gmail.com" }: Usuario autenticado
   * 
   * setUser - Función para cambiar el estado
   * - setUser(usuario) → Guarda usuario (después de login)
   * - setUser(null) → Borra usuario (después de logout)
   */
  const [user, setUser] = useState(null);
  
  /**
   * loading - Estado para saber si estamos verificando la sesión
   * 
   * ¿Para qué sirve?
   * - Cuando la app se carga, no sabemos si hay sesión o no
   * - loading = true → Estamos consultando al backend
   * - loading = false → Ya terminamos de verificar
   * 
   * ¿Por qué es importante?
   * - Evita mostrar el login prematuramente
   * - Muestra "Cargando..." mientras verificamos
   * - Da mejor experiencia al usuario
   * 
   * Flujo:
   * 1. App carga → loading = true
   * 2. Llamamos getCurrentUser()
   * 3. Esperamos respuesta del backend
   * 4. Actualizamos user (con datos o null)
   * 5. loading = false
   * 6. App renderiza según el resultado
   */
  const [loading, setLoading] = useState(true);
  
  // ============================================
  // EFECTO: Verificar sesión al cargar
  // ============================================
  
  /**
   * useEffect - Verificar si hay sesión activa
   * 
   * ¿Cuándo se ejecuta?
   * - Una sola vez cuando el componente se monta
   * - Gracias al array vacío [] al final
   * 
   * ¿Qué hace?
   * - Consulta al backend si hay sesión activa
   * - Si hay sesión → Recupera y guarda el usuario
   * - Si no hay sesión → Deja user = null
   * 
   * ¿Por qué es necesario?
   * - Al recargar la página (F5), el estado de React se reinicia
   * - user vuelve a null AUNQUE la cookie siga existiendo
   * - Este useEffect "recupera" el usuario desde la cookie
   * 
   * Caso de uso:
   * 1. Usuario inicia sesión
   * 2. Navega por la app
   * 3. Recarga la página (F5)
   * 4. SIN este useEffect → user = null → Vuelve al login ❌
   * 5. CON este useEffect → user recuperado → Sigue en Home ✅
   */
  useEffect(() => {
    /**
     * isMounted - Bandera para evitar setState si el componente se desmonta
     * 
     * ¿Por qué?
     * - Si el usuario navega rápido, el componente puede desmontarse
     * - La petición puede terminar después
     * - React avisa: "Can't perform a React state update on an unmounted component"
     * - Con isMounted, evitamos ese warning y lo hacemos más "formal"
     */
    let isMounted = true;
    
    /**
     * checkSession - Función que verifica la sesión
     * 
     * ¿Por qué una función separada?
     * - useEffect no puede ser async directamente
     * - Creamos una función async dentro
     * - La ejecutamos inmediatamente después
     */
    const checkSession = async () => {
      try {
        /**
         * Consultar al backend
         * 
         * getCurrentUser() hace:
         * 1. GET http://localhost:3000/api/auth/me
         * 2. Envía la cookie 'auth_token' (credentials: 'include')
         * 3. Backend verifica JWT
         * 4. Si existe → Devuelve usuario
         * 5. Si no existe → Devuelve null
         */
        const usuario = await getCurrentUser();
        
        /**
         * Actualizar el estado (solo si sigue montado)
         */
        if (isMounted) {
          setUser(usuario);
        }
        
      } catch (error) {
        /**
         * Manejo de errores
         */
        console.error('Error al verificar sesión:', error);
        
        /**
         * Asegurarnos de que user = null si hay error
         */
        if (isMounted) {
          setUser(null);
        }
        
      } finally {
        /**
         * finally - Se ejecuta SIEMPRE
         */
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    /**
     * Ejecutar la función
     */
    checkSession();
    
    /**
     * Cleanup - cuando se desmonta el componente
     */
    return () => {
      isMounted = false;
    };
  }, []);
  /**
   * Dependencias: []
   * 
   * Array vacío significa: "Ejecutar solo UNA vez al montar"
   */
  
  // ============================================
  // VALOR COMPARTIDO
  // ============================================
  
  /**
   * value - Los datos que compartimos con todos los componentes
   */
  const value = {
    user,      // Estado actual del usuario
    setUser,   // Función para actualizar el usuario
    loading,   // Estado de carga de la verificación
  };
  
  // ============================================
  // PROVIDER - Compartir los datos
  // ============================================
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// ============================================
// HOOK PERSONALIZADO - Para usar el Context
// ============================================

/**
 * useUser - Hook para acceder al Context fácilmente
 * 
 * @returns {Object} { user, setUser, loading }
 */
export function useUser() {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser debe usarse dentro de UserProvider');
  }
  
  return context;
}
