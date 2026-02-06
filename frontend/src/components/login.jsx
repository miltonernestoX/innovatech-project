import { useState } from 'react';
import { getGoogleAuthUrl } from '../api/auth';

// ============================================
// Login.jsx (Google-only)
// - Pantalla pública para el tutorial ("/")
// - Pide la URL al backend y redirige
// - Usa el helper getGoogleAuthUrl() (safeFetch + credentials + logs)
// ============================================

function Login() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isStartingLogin, setIsStartingLogin] = useState(false);

  // ============================================
  // Handlers
  // ============================================

  const handleLoginGoogle = async () => {
    setErrorMsg('');
    setIsStartingLogin(true);

    try {
      sessionStorage.setItem('authProvider', 'google');

      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('LOGIN ERROR (Google):', error);
      setErrorMsg(error?.message || 'No se pudo iniciar sesión con Google.');
      setIsStartingLogin(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Login</h1>

      {errorMsg ? <p style={{ color: 'red' }}>{errorMsg}</p> : null}

      <button onClick={handleLoginGoogle} disabled={isStartingLogin}>
        {isStartingLogin ? 'Redirigiendo...' : 'Iniciar sesión con Google'}
      </button>
    </div>
  );
}

export default Login;
