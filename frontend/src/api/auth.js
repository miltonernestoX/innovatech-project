/**
 * ============================================
 * ARCHIVO: auth.js
 * ============================================
 * Funciones que hablan con el backend para login/sesión.
 */

const API_BASE_URL = "http://localhost:3000";

/**
 * Helper: fetch con logs claros
 * (para que NUNCA más sea “Failed to fetch” misterioso)
 */
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include", // ✅ siempre mandar cookies
    });

    // Log útil para depurar
    console.log("🌐 FETCH:", options?.method || "GET", url, "->", res.status);

    return res;
  } catch (err) {
    console.error("❌ FETCH FALLÓ:", url, err);
    // Este error solo ocurre si NO hubo respuesta (CORS/NETWORK)
    throw new Error("ERROR REAL: Failed to fetch (CORS o backend apagado)");
  }
}

// ============================================
// GOOGLE: obtener URL OAuth
// ============================================
export const getGoogleAuthUrl = async () => {
  console.log("🔵 getGoogleAuthUrl() llamado");

  const response = await safeFetch(`${API_BASE_URL}/auth/google/url`, {
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Backend respondió ${response.status} al pedir URL de Google: ${text}`
    );
  }

  const data = await response.json();
  console.log("🟢 Data recibida:", data);

  if (!data || !data.url) {
    throw new Error('El backend no devolvió la propiedad "url".');
  }

  return data.url;
};

// ============================================
// MICROSOFT: deshabilitado
// ============================================
export const getMicrosoftAuthUrl = async () => {
  throw new Error("Microsoft no está habilitado en este proyecto");
};

// ============================================
// SESIÓN: obtener usuario actual
// BACKEND: GET /api/auth/me
// ============================================
export const getCurrentUser = async () => {
  try {
    const response = await safeFetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data?.success === true && data?.data) {
      return data.data; // ✅ usuario real desde MySQL
    }

    return null;
  } catch (error) {
    console.error("❌ Error al obtener usuario actual:", error);
    return null;
  }
};

// ============================================
// LOGOUT
// ============================================
export const logout = async () => {
  const response = await safeFetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Error al cerrar sesión (${response.status}): ${text}`);
  }

  return true;
};
