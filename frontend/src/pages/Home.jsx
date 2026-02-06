/**
 * ============================================
 * COMPONENTE: Home
 * ============================================
 * Esta es la página principal de la aplicación
 * Se muestra DESPUÉS de que el usuario inicia sesión
 *
 * En tu proyecto NO hay Login.jsx, así que:
 * - Si NO hay usuario, mostramos aquí el botón de "Iniciar sesión con Google"
 * - Si SÍ hay usuario, mostramos la vista normal (bienvenida, links, logout)
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { logout, getGoogleAuthUrl } from '../api/auth';

function Home() {
  // ============================================
  // HOOKS
  // ============================================
  const { user, setUser, loading } = useUser();
  const navigate = useNavigate();

  // ============================================
  // ESTADOS
  // ============================================
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isStartingLogin, setIsStartingLogin] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    // Sin redirecciones automáticas aquí, para evitar bucles.
  }, []);

  // ============================================
  // FUNCIONES
  // ============================================

  /**
   * Iniciar login con Google
   * - Pide al backend la URL de Google (usando auth.js)
   * - Redirige el navegador a Google OAuth
   */
  const loginWithGoogle = async () => {
    // ✅ Evitar doble click / re-entradas
    if (isStartingLogin) return;

    // ✅ Si ya hay usuario, no tiene sentido iniciar login otra vez
    if (user) return;

    try {
      setErrorMsg(null);
      setIsStartingLogin(true);

      // ✅ Usamos la función centralizada (evita “Failed to fetch” por URL incorrecta)
      const url = await getGoogleAuthUrl();

      // ✅ Redirección normal del navegador
      window.location.href = url;
    } catch (error) {
      // ✅ CAMBIO: mostrar el error REAL para no adivinar
      console.error('Error iniciando login con Google:', error);
      const msg = error?.message || String(error);
      setErrorMsg(msg);
      alert('ERROR REAL: ' + msg);
    } finally {
      // ✅ IMPORTANTE: si falla antes de redirigir, liberamos el botón
      setIsStartingLogin(false);
    }
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    // ✅ Evitar doble click / re-entradas
    if (isLoggingOut) return;

    try {
      setErrorMsg(null);
      setIsLoggingOut(true);

      await logout();

      setUser(null);

      // ✅ Mejor: volver a "/" (Home es la principal y ahí mismo muestra login)
      // Evita rebotes de ProtectedRoute si vas a "/home" estando deslogueado
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      const msg = error?.message || 'Error al cerrar sesión. Por favor, intenta de nuevo.';
      setErrorMsg(msg);
      alert(msg);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ============================================
  // RENDER CONDICIONAL
  // ============================================

  // 1) Loading
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Cargando datos del usuario...</h2>
      </div>
    );
  }

  // 2) Si NO hay usuario: mostramos "login" aquí mismo
  if (!user) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Iniciar sesión</h1>
        <p>Para continuar, inicia sesión con Google.</p>

        {errorMsg && (
          <p style={{ marginTop: '1rem', color: 'red' }}>
            Error: {errorMsg}
          </p>
        )}

        <button onClick={loginWithGoogle} disabled={isStartingLogin}>
          {isStartingLogin ? 'Redirigiendo a Google...' : 'Iniciar sesión con Google'}
        </button>

        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
          Asegúrate de que el backend esté corriendo en <b>http://localhost:3000</b>.
        </p>
      </div>
    );
  }

  // Normalizar datos (para soportar ambos formatos)
  const displayName = user.nombre_completo || user.name || 'Usuario';
  const displayEmail = user.correo || user.email || '—';
  const displayProvider = user.proveedor_login || user.provider || 'google';

  // 3) Si SÍ hay usuario: Home normal
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>¡Bienvenido, {displayName}!</h1>

      {errorMsg && (
        <p style={{ marginTop: '1rem', color: 'red' }}>
          Error: {errorMsg}
        </p>
      )}

      <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
        <p style={{ margin: 0 }}>
          <b>Email:</b> {displayEmail}
        </p>
        <p style={{ margin: 0 }}>
          <b>Proveedor:</b> {displayProvider}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <Link to="/ordenes">Ir a Ordenes</Link>
        <Link to="/usuarios">Ir a Usuarios</Link>
      </div>

      <div>
        <button onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}

export default Home;
