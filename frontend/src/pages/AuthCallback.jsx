import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Backend URL
 *
 * Importante:
 * - El backend corre en http://localhost:3000
 * - La cookie se envía SOLO si usamos credentials: 'include'
 */
const BACKEND_URL = 'http://localhost:3000';

function AuthCallback() {
  // ============================================
  // HOOKS
  // ============================================

  /**
   * useNavigate:
   * - Para redirigir cuando terminemos
   */
  const navigate = useNavigate();

  /**
   * useUser:
   * - setUser: Guardar usuario autenticado en el Context
   */
  const { setUser } = useUser();

  // ============================================
  // ESTADOS LOCALES
  // ============================================

  /**
   * loading:
   * - Mientras consultamos al backend si la cookie es válida
   *
   * error:
   * - Para mostrar un mensaje si algo falla
   */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================
  // EFECTOS
  // ============================================

  /**
   * useEffect:
   * - Se ejecuta al cargar la página
   * - Aquí validamos la sesión con el backend
   *
   * ¿Por qué aquí?
   * - Porque esta página SOLO existe para finalizar el login
   * - Al entrar aquí, ya deberíamos tener la cookie auth_token creada por el backend
   */
  useEffect(() => {
    const finalizarAutenticacion = async () => {
      try {
        /**
         * Tutorial / Provider:
         * - Si guardas el provider en sessionStorage (aunque solo uses Google),
         *   este es el lugar ideal para limpiarlo.
         */
        const provider = sessionStorage.getItem('authProvider');
        if (provider) sessionStorage.removeItem('authProvider');

        /**
         * Endpoint:
         * GET http://localhost:3000/protected/me
         *
         * ¿Qué hace?
         * - Lee la cookie auth_token
         * - Verifica el JWT
         * - Busca el usuario en MySQL
         * - Devuelve el usuario desde la DB
         *
         * ¡IMPORTANTE!
         * credentials: 'include'
         * - Sin esto, el navegador NO enviará la cookie al backend
         * - Resultado sin include: 401
         */
        const response = await fetch(`${BACKEND_URL}/protected/me`, {
          method: 'GET',
          credentials: 'include'
        });

        // Paso 2) Si el backend responde error → volver al login
        if (!response.ok) {
          setError('No se pudo validar la sesión. Intenta iniciar sesión de nuevo.');
          setLoading(false);
          setTimeout(() => navigate('/', { replace: true }), 800);
          return;
        }

        // Paso 3) Parsear JSON
        const data = await response.json();

        /**
         * OJO: Tu backend devuelve:
         * {
         *   success: true,
         *   data: { id, email, name, picture, provider, ... }
         * }
         */
        if (!data || data.success !== true || !data.data) {
          setError('Respuesta inválida del servidor. Intenta iniciar sesión nuevamente.');
          setLoading(false);
          setTimeout(() => navigate('/', { replace: true }), 800);
          return;
        }

        // Paso 4) Guardar usuario en Context
        setUser(data.data);

        // Paso 5) Redirigir a Home
        setLoading(false);
        navigate('/home', { replace: true });
      } catch (err) {
        console.error('Error en AuthCallback:', err);
        setError('Error de conexión con el servidor. Verifica que el backend esté corriendo.');
        setLoading(false);
        setTimeout(() => navigate('/', { replace: true }), 1000);
      }
    };

    finalizarAutenticacion();
  }, [navigate, setUser]);

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Procesando autenticación...</h2>
        <p>Espera un momento.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Ocurrió un problema</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Autenticación completada</h2>
      <p>Redirigiendo...</p>
    </div>
  );
}

export default AuthCallback;
