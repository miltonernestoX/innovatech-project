# 🔐 Tutorial: Sistema de Autenticación OAuth2 (Google + Microsoft)

Este documento explica **paso a paso** cómo construir el sistema de autenticación, siguiendo la **secuencia lógica de desarrollo**.

---

## 📋 Índice del Tutorial

1. [Configuración Inicial del Proyecto](#1-configuración-inicial-del-proyecto)
2. [Crear el Componente Login](#2-crear-el-componente-login)
3. [Crear la Carpeta API y Funciones de Autenticación](#3-crear-la-carpeta-api-y-funciones-de-autenticación)
4. [Implementar la Función handleAuth en Login](#4-implementar-la-función-handleauth-en-login)
5. [Crear el Context para Compartir el Usuario](#5-crear-el-context-para-compartir-el-usuario)
6. [Crear el Componente AuthCallback](#6-crear-el-componente-authcallback)
7. [Crear la Página Home](#7-crear-la-página-home)
8. [Configurar las Rutas en App.jsx](#8-configurar-las-rutas-en-appjsx)
9. [Flujo Completo de Autenticación](#9-flujo-completo-de-autenticación)

---

## 1. Configuración Inicial del Proyecto

### 1.1 Estructura de Carpetas

```
ProyectoFinal/
├── src/
│   ├── components/      ← Crear esta carpeta
│   ├── api/            ← Crear esta carpeta
│   ├── context/        ← Crear esta carpeta
│   ├── pages/          ← Crear esta carpeta
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

### 1.2 Instalar Dependencias

```bash
npm install react-router-dom
```

---

## 2. Crear el Componente Login

**Archivo:** `src/components/login.jsx`

### 2.1 Estructura Básica del Componente

Primero creamos el componente con su estructura básica:

```jsx
import React, { useState } from 'react'
import { getGoogleAuthUrl, getMicrosoftAuthUrl } from '../api/auth'

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div>
      <h1>Login Page</h1>
    </div>
  )
}

export default Login
```

**Explicación:**
- `useState(false)` → Para controlar el estado de carga
- `useState(null)` → Para guardar mensajes de error
- Importamos funciones de `auth.js` (las crearemos después)

---

### 2.2 Agregar los Botones de Autenticación

Dentro del `return`, agregamos los dos botones:

```jsx
return (
  <div>
    <h1>Login Page</h1>
    
    {/* Mostrar error si existe */}
    {error && (
      <p style={{ color: 'red' }}>
        Error: {error}
      </p>
    )}
    
    {/* Botón de Google */}
    <button 
      onClick={() => handleAuth('google')}
      disabled={loading}
    >
      {loading ? 'Cargando...' : 'Iniciar sesión con Google'}
    </button>
    
    {/* Botón de Microsoft */}
    <button 
      onClick={() => handleAuth('microsoft')}
      disabled={loading}
    >
      {loading ? 'Cargando...' : 'Iniciar sesión con Microsoft'}
    </button>
  </div>
)
```

**Explicación:**
- `onClick={() => handleAuth('google')}` → Ejecuta handleAuth cuando se hace click
- `disabled={loading}` → Deshabilita el botón mientras carga
- `{loading ? 'Cargando...' : 'Texto'}` → Cambia el texto según el estado

---

## 3. Crear la Carpeta API y Funciones de Autenticación

**Archivo:** `src/api/auth.js`

### 3.1 Configuración Base

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Explicación:**
- Esta es la URL base del backend
- Todas las rutas empezarán con esta URL

---

### 3.2 Función: getGoogleAuthUrl()

Esta función obtiene la URL de autenticación de Google desde el backend:

```javascript
export const getGoogleAuthUrl = async () => {
  // 1. Hacer petición al backend
  const response = await fetch(`${API_BASE_URL}/auth/google/url`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 2. Verificar si hubo error
  if (!response.ok) {
    throw new Error('Error al obtener URL de Google');
  }

  // 3. Convertir respuesta a JSON
  const data = await response.json();

  // 4. Validar que la URL exista
  if (!data.success || !data.data.url) {
    throw new Error('URL de Google no disponible');
  }

  // 5. Retornar solo la URL
  return data.data.url;
};
```

**Explicación:**
- `fetch()` → Hace la petición HTTP al backend
- `await` → Espera la respuesta antes de continuar
- `response.json()` → Convierte la respuesta en objeto JavaScript
- Retorna la URL de Google OAuth

---

### 3.3 Función: getMicrosoftAuthUrl()

Exactamente igual que `getGoogleAuthUrl`, pero para Microsoft:

```javascript
export const getMicrosoftAuthUrl = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/microsoft/url`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener URL de Microsoft');
  }

  const data = await response.json();

  if (!data.success || !data.data.url) {
    throw new Error('URL de Microsoft no disponible');
  }

  return data.data.url;
};
```

---

### 3.4 Función: authenticateWithGoogle()

Esta función envía el código de autorización al backend:

```javascript
export const authenticateWithGoogle = async (code) => {
  const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // ← Importante: permite enviar/recibir cookies
    body: JSON.stringify({ code }),  // Enviamos el código
  });

  if (!response.ok) {
    throw new Error('Error en autenticación con Google');
  }

  const data = await response.json();

  if (!data.success || !data.data.usuario) {
    throw new Error('Datos de usuario no disponibles');
  }

  return data.data.usuario;  // Retorna el usuario autenticado
};
```

**Explicación:**
- `method: 'POST'` → Enviamos datos al backend
- `credentials: 'include'` → **Crucial**: permite que el backend establezca cookies (JWT)
- `JSON.stringify({ code })` → Convierte el objeto en texto JSON
- Retorna el objeto usuario con sus datos

---

### 3.5 Función: authenticateWithMicrosoft()

Igual que Google, pero para Microsoft:

```javascript
export const authenticateWithMicrosoft = async (code) => {
  const response = await fetch(`${API_BASE_URL}/auth/microsoft/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Error en autenticación con Microsoft');
  }

  const data = await response.json();

  if (!data.success || !data.data.usuario) {
    throw new Error('Datos de usuario no disponibles');
  }

  return data.data.usuario;
};
```

---

### 3.6 Función: logout()

Esta función cierra la sesión del usuario:

```javascript
export const logout = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // Envía la cookie para que el backend la borre
  });

  if (!response.ok) {
    throw new Error('Error al cerrar sesión');
  }

  const data = await response.json();
  return data;
};
```

---

## 4. Implementar la Función handleAuth en Login

**Volvemos a:** `src/components/login.jsx`

### 4.1 Crear la Función handleAuth

Agregamos esta función **antes del return**:

```javascript
const handleAuth = async (provider) => {
  try {
    // PASO 1: Activar loading
    setLoading(true);
    setError(null);

    // PASO 2: Obtener la URL del proveedor
    let url;
    
    if (provider === 'google') {
      url = await getGoogleAuthUrl();
    } else if (provider === 'microsoft') {
      url = await getMicrosoftAuthUrl();
    }

    // PASO 3: Guardar el proveedor en sessionStorage
    sessionStorage.setItem('authProvider', provider);
    
    // PASO 4: Redirigir al usuario a Google/Microsoft
    window.location.href = url;
    
  } catch (err) {
    console.error(`Error en autenticación con ${provider}:`, err);
    setError(err.message);
    setLoading(false);
  }
};
```

**Explicación:**
1. **Activar loading** → Cambia el botón a "Cargando..."
2. **Obtener URL** → Llama a `getGoogleAuthUrl()` o `getMicrosoftAuthUrl()`
3. **Guardar proveedor** → En `sessionStorage` para recordar si fue Google o Microsoft
4. **Redirigir** → `window.location.href` lleva al usuario a Google/Microsoft

---

### 4.2 ¿Por qué guardamos el proveedor en sessionStorage?

```javascript
sessionStorage.setItem('authProvider', provider);
```

**Flujo completo:**
1. Usuario click en "Google" → Guardamos `'google'` en sessionStorage
2. Usuario va a Google → Se autentica
3. Google redirige a `/auth/callback?code=ABC123`
4. **AuthCallback** lee sessionStorage → Encuentra `'google'`
5. AuthCallback llama `authenticateWithGoogle(code)`

**Sin sessionStorage:**
- No sabríamos si el código es de Google o Microsoft
- No sabríamos qué función llamar

---

## 5. Crear el Context para Compartir el Usuario

**Archivo:** `src/context/UserContext.jsx`

### 5.1 ¿Qué es el Context?

El Context permite **compartir datos** entre componentes sin pasarlos por props.

**Problema sin Context:**
```
App → AuthCallback → Home
      ↓ props      ↓ props
```
Hay que pasar `user` por cada nivel (prop drilling).

**Solución con Context:**
```
UserProvider envuelve toda la app
  ↓
Cualquier componente llama useUser() y obtiene el user
```

---

### 5.2 Código del Context

```jsx
import { createContext, useContext, useState } from 'react'

// 1. Crear el Context
const UserContext = createContext();

// 2. Crear el Provider
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// 3. Crear el Hook personalizado
export function useUser() {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser debe usarse dentro de UserProvider');
  }
  
  return context;
}
```

**Explicación:**
- `createContext()` → Crea el Context
- `UserProvider` → Componente que envuelve la app y guarda el usuario
- `useUser()` → Hook que cualquier componente puede usar para obtener `{ user, setUser }`

---

## 6. Crear el Componente AuthCallback

**Archivo:** `src/pages/AuthCallback.jsx`

### 6.1 ¿Qué hace AuthCallback?

Cuando Google/Microsoft redirigen al usuario de vuelta, llegan a esta página:

```
http://localhost:5173/auth/callback?code=ABC123XYZ
```

AuthCallback debe:
1. Capturar el `code` de la URL
2. Leer qué proveedor fue (de sessionStorage)
3. Enviar el código al backend
4. Guardar el usuario en el Context
5. Redirigir a Home

---

### 6.2 Código Completo

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { authenticateWithGoogle, authenticateWithMicrosoft } from '../api/auth'

function AuthCallback() {
  const [status, setStatus] = useState('Procesando autenticación...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // PASO 1: Obtener parámetros de la URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (!code) {
          throw new Error('Código de autorización no encontrado');
        }

        // PASO 2: Obtener el proveedor de sessionStorage
        const provider = sessionStorage.getItem('authProvider');
        
        if (!provider) {
          throw new Error('Proveedor de autenticación no encontrado');
        }

        setStatus(`Autenticando con ${provider}...`);

        // PASO 3: Autenticar según el proveedor
        let usuario;
        
        if (provider === 'google') {
          usuario = await authenticateWithGoogle(code);
        } else if (provider === 'microsoft') {
          usuario = await authenticateWithMicrosoft(code);
        }

        // PASO 4: Guardar usuario en Context
        setUser(usuario);

        // PASO 5: Limpiar sessionStorage
        sessionStorage.removeItem('authProvider');

        // PASO 6: Redirigir a Home
        setStatus('¡Autenticación exitosa! Redirigiendo...');
        setTimeout(() => {
          navigate('/home');
        }, 1000);

      } catch (err) {
        console.error('Error en callback:', err);
        setError(err.message);
        setStatus('Error en la autenticación');
      }
    };

    processAuthCallback();
  }, [navigate, setUser]);

  return (
    <div>
      <h2>{status}</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

export default AuthCallback
```

**Explicación:**
1. **URLSearchParams** → Lee el `code` de la URL
2. **sessionStorage.getItem** → Obtiene si fue Google o Microsoft
3. **authenticateWithGoogle/Microsoft** → Envía el código al backend
4. **setUser(usuario)** → Guarda el usuario en el Context (ahora TODOS los componentes lo ven)
5. **navigate('/home')** → Redirige a la página Home

---

## 7. Crear la Página Home

**Archivo:** `src/pages/Home.jsx`

### 7.1 Código Completo

```jsx
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { logout } from '../api/auth'

function Home() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div>
      <h1>Home</h1>
      
      {user && (
        <div>
          <h2>Información del Usuario</h2>
          <p><strong>ID:</strong> {user.id_usuario}</p>
          <p><strong>Nombre:</strong> {user.nombre_completo}</p>
          <p><strong>Correo:</strong> {user.correo}</p>
        </div>
      )}
      
      <button onClick={handleLogout}>
        Cerrar Sesión
      </button>
    </div>
  );
}

export default Home
```

**Explicación:**
- `useUser()` → Obtiene el usuario del Context
- `handleLogout()` → Llama a `logout()` del backend y limpia el Context
- `navigate('/')` → Redirige al Login

---

## 8. Configurar las Rutas en App.jsx

**Archivo:** `src/App.jsx`

### 8.1 Código Completo

```jsx
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Login from './components/login'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App
```

**Explicación:**
- `<UserProvider>` envuelve TODO → Todos los componentes tienen acceso al Context
- `<BrowserRouter>` habilita las rutas
- Cada `<Route>` define una página:
  - `/` → Login
  - `/auth/callback` → AuthCallback (Google/Microsoft redirigen aquí)
  - `/home` → Home (después de autenticar)

---

## 9. Flujo Completo de Autenticación

### 9.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario en Login.jsx                                   │
│ - Usuario hace click en "Google"                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: handleAuth('google')                                   │
│ - Llama getGoogleAuthUrl()                                     │
│ - Obtiene: https://accounts.google.com/o/oauth2/v2/auth?...   │
│ - Guarda 'google' en sessionStorage                           │
│ - Redirige: window.location.href = url                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Usuario en Google                                      │
│ - Google muestra su página de login                           │
│ - Usuario ingresa email/contraseña                            │
│ - Usuario autoriza la aplicación                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Google redirige de vuelta                             │
│ - URL: http://localhost:5173/auth/callback?code=ABC123        │
│ - Carga el componente AuthCallback.jsx                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: AuthCallback procesa                                  │
│ - Lee code de la URL: params.get('code')                      │
│ - Lee proveedor: sessionStorage.getItem('authProvider')       │
│ - Llama authenticateWithGoogle(code)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: Backend autentica                                     │
│ - Recibe el código                                            │
│ - Intercambia código por tokens con Google                    │
│ - Obtiene datos del usuario de Google                         │
│ - Busca/crea usuario en la base de datos                      │
│ - Genera JWT                                                  │
│ - Establece cookie 'auth_token'                               │
│ - Retorna datos del usuario                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 7: AuthCallback guarda usuario                           │
│ - setUser(usuario) → Guarda en Context                        │
│ - navigate('/home') → Redirige a Home                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 8: Home muestra datos                                    │
│ - const { user } = useUser() → Obtiene usuario del Context    │
│ - Muestra: user.nombre_completo, user.correo                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 9.2 Flujo de Datos del Context

```
┌─────────────────────────────────────────────────────────────────┐
│ UserProvider (en App.jsx)                                      │
│                                                                 │
│ - Guarda: user = null (inicialmente)                          │
│ - Expone: { user, setUser }                                   │
└─────────────────────────────────────────────────────────────────┘
                    ↓ Envuelve a todos
        ┌───────────┴───────────┬─────────────────┐
        ↓                       ↓                 ↓
   ┌─────────┐          ┌──────────────┐    ┌────────┐
   │ Login   │          │ AuthCallback │    │  Home  │
   └─────────┘          └──────────────┘    └────────┘
                               ↓                  ↓
                        setUser(usuario)    const { user } = useUser()
                               ↓                  ↓
                        UserProvider guarda   Home lee el usuario
                        el usuario            y lo muestra
```

---

## 🎯 Puntos Clave

### 1. **sessionStorage.setItem('authProvider', provider)**
   - **Propósito:** Recordar si fue Google o Microsoft
   - **Uso:** AuthCallback lee este valor para saber qué función llamar
   - **Alternativa:** También se podría pasar como parámetro en la URL

### 2. **credentials: 'include'**
   - **Propósito:** Permitir envío/recepción de cookies
   - **Uso:** El backend establece la cookie `auth_token` (JWT)
   - **Importante:** Sin esto, las cookies no funcionarán

### 3. **UserContext**
   - **Propósito:** Compartir el usuario entre componentes
   - **Ventaja:** Evita prop drilling
   - **Uso:** `const { user, setUser } = useUser()`

### 4. **React Router**
   - **Rutas:**
     - `/` → Login
     - `/auth/callback` → AuthCallback
     - `/home` → Home
   - **Navegación:** `navigate('/home')` en lugar de `window.location.href`

---

## ✅ Checklist de Implementación

- [ ] Crear carpetas: `components/`, `api/`, `context/`, `pages/`
- [ ] Instalar: `npm install react-router-dom`
- [ ] Crear `src/api/auth.js` con todas las funciones
- [ ] Crear `src/context/UserContext.jsx`
- [ ] Crear `src/components/login.jsx` con botones
- [ ] Implementar `handleAuth()` en Login
- [ ] Crear `src/pages/AuthCallback.jsx`
- [ ] Crear `src/pages/Home.jsx`
- [ ] Configurar rutas en `src/App.jsx`
- [ ] Verificar que el backend esté corriendo en `localhost:3000`
- [ ] Probar login con Google
- [ ] Probar login con Microsoft
- [ ] Probar logout

---

## 🚀 Cómo Ejecutar

1. **Backend:**
   ```bash
   cd BackEnd-nodejs
   npm install
   npm run dev
   ```

2. **Frontend:**
   ```bash
   cd ProyectoFinal
   npm install
   npm run dev
   ```

3. **Abrir navegador:**
   ```
   http://localhost:5173
   ```

---

## 📝 Notas Importantes

1. **El backend debe estar corriendo** en `http://localhost:3000`
2. **Las credenciales de OAuth2** deben estar configuradas en el `.env` del backend
3. **La URL de redirección** en Google/Microsoft debe ser: `http://localhost:5173/auth/callback`
4. **Las cookies requieren** `credentials: 'include'` en todas las peticiones

---

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| "Error al obtener URL de Google" | Verificar que el backend esté corriendo |
| "Código de autorización no encontrado" | Verificar la URL de redirección en Google Console |
| "Proveedor de autenticación no encontrado" | Verificar que `sessionStorage` guardó el proveedor |
| Usuario no se guarda en Context | Verificar que `setUser(usuario)` se ejecuta en AuthCallback |
| Cookies no funcionan | Agregar `credentials: 'include'` en todas las peticiones |

---

## 📚 Recursos Adicionales

- [Documentación de React](https://react.dev/)
- [Documentación de React Router](https://reactrouter.com/)
- [Documentación de OAuth2](https://oauth.net/2/)
- [Google OAuth2 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth2 Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

---

---

# 🔄 EXTENSIÓN: Persistencia de Inicio de Sesión

> **📌 Nota:** Esta sección documenta funcionalidad ADICIONAL que se implementa DESPUÉS de completar el tutorial base (pasos 1-9).

---

## 🎯 ¿Qué es la Persistencia de Sesión?

### Problema sin Persistencia

```
1. Usuario inicia sesión ✅
2. Navega por la app ✅
3. Recarga la página (F5) ❌
4. Context se reinicia → user = null
5. Usuario es enviado al login OTRA VEZ 😡
```

**¿Por qué pasa esto?**
- Al recargar, React se reinicia desde cero
- El estado (Context) vuelve a sus valores iniciales: `user = null`
- PERO la cookie JWT sigue existiendo en el navegador
- El backend todavía tiene la sesión activa

### Solución con Persistencia

```
1. Usuario inicia sesión ✅
2. Backend establece cookie JWT ✅
3. Usuario recarga la página (F5)
4. UserContext ejecuta useEffect
5. Llama getCurrentUser() → Verifica cookie con backend
6. Backend valida JWT → Devuelve usuario
7. Context se actualiza: user = { ... }
8. Usuario continúa donde estaba ✅
```

---

## 📝 Cambios Necesarios

### 10.1 Agregar Función getCurrentUser() en auth.js

**Archivo:** `src/api/auth.js`

**AGREGAR al final del archivo:**

```javascript
/**
 * FUNCIÓN: getCurrentUser - Verificar sesión activa
 * 
 * ¿Qué hace?
 * - Consulta al backend si hay una sesión activa
 * - Si existe sesión → Devuelve los datos del usuario
 * - Si no existe → Devuelve null
 * 
 * ¿Cuándo se usa?
 * - Al cargar la aplicación (useEffect en UserContext)
 * - Para "recuperar" el usuario si hay cookie activa
 * 
 * Endpoint: GET /api/auth/me
 * Requiere: Cookie JWT (enviada automáticamente con credentials: 'include')
 */
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',  // ← CRÍTICO: Envía la cookie JWT
    });

    if (!response.ok) {
      return null;  // No hay sesión activa
    }

    const data = await response.json();

    if (!data.success || !data.data || !data.data.usuario) {
      return null;  // Respuesta inválida
    }

    return data.data.usuario;  // Retorna el usuario
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;  // En caso de error, asumir que no hay sesión
  }
};
```

**Explicación de cambios:**
1. ✅ Nueva función exportada: `getCurrentUser`
2. ✅ Hace GET a `/api/auth/me`
3. ✅ Usa `credentials: 'include'` para enviar la cookie
4. ✅ Retorna `usuario` si existe sesión, `null` si no

---

### 10.2 Modificar UserContext.jsx para Verificar Sesión

**Archivo:** `src/context/UserContext.jsx`

#### CAMBIO 1: Agregar Importaciones

**ANTES:**
```jsx
import { createContext, useContext, useState } from 'react'
```

**DESPUÉS:**
```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser } from '../api/auth'
```

**Explicación:**
- ✅ Importamos `useEffect` para ejecutar código al montar el componente
- ✅ Importamos `getCurrentUser` para verificar sesión activa

---

#### CAMBIO 2: Agregar Estado de Loading

**ANTES:**
```jsx
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const value = {
    user,
    setUser,
  };
```

**DESPUÉS:**
```jsx
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  // ← NUEVO ESTADO
  
  // ... (useEffect se agrega aquí - ver siguiente sección)
  
  const value = {
    user,
    setUser,
    loading,  // ← NUEVO: Compartir loading con componentes
  };
```

**Explicación:**
- ✅ Nuevo estado: `loading = true` (inicialmente estamos verificando)
- ✅ Compartimos `loading` en el value del Context
- ✅ Los componentes pueden mostrar "Cargando..." mientras verificamos

---

#### CAMBIO 3: Agregar useEffect para Verificar Sesión

**DESPUÉS DEL ESTADO, ANTES DEL VALUE:**

```jsx
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ← AGREGAR ESTE useEffect AQUÍ
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Consultar al backend si hay sesión activa
        const usuario = await getCurrentUser();
        
        // Actualizar el usuario (puede ser objeto o null)
        setUser(usuario);
        
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        setUser(null);  // En caso de error, no hay sesión
        
      } finally {
        setLoading(false);  // Terminamos de verificar
      }
    };
    
    checkSession();
  }, []);  // Array vacío = ejecutar solo UNA vez al montar
  
  const value = {
    user,
    setUser,
    loading,
  };
  
  // ... resto del código
```

**Explicación:**
- ✅ `useEffect` se ejecuta al montar el componente
- ✅ Llama a `getCurrentUser()` para verificar sesión
- ✅ Si hay sesión → `setUser(usuario)` guarda el usuario
- ✅ Si no hay sesión → `setUser(null)`
- ✅ En `finally` → `setLoading(false)` indica que terminamos

---

### 10.3 (Opcional) Mostrar Loading en Componentes

**Ejemplo en Home.jsx:**

```jsx
function Home() {
  const { user, loading } = useUser();  // ← Obtener loading
  const navigate = useNavigate();
  
  // Mostrar "Cargando..." mientras verificamos sesión
  if (loading) {
    return <div>Cargando datos del usuario...</div>;
  }
  
  // Si no hay usuario después de cargar, redirigir a login
  if (!user) {
    navigate('/');
    return null;
  }
  
  // Usuario existe, mostrar contenido normal
  return (
    <div>
      <h1>¡Bienvenido, {user.nombre_completo}!</h1>
      {/* ... resto del componente */}
    </div>
  );
}
```

**Explicación:**
- ✅ Verificamos `loading` antes que `user`
- ✅ Si `loading = true` → Mostramos "Cargando..."
- ✅ Si `loading = false` y `user = null` → Redirigir a login
- ✅ Si `loading = false` y `user` existe → Mostrar contenido

---

## 🔄 Flujo Completo con Persistencia

```
┌──────────────────────────────────────────────────────────────────┐
│ INICIO: Usuario recarga la página (F5)                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PASO 1: React se reinicia                                       │
│ - Context: user = null, loading = true                          │
│ - Componentes muestran "Cargando..."                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PASO 2: UserContext se monta                                    │
│ - useEffect se ejecuta                                          │
│ - Llama a checkSession()                                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PASO 3: getCurrentUser() consulta al backend                   │
│ - GET http://localhost:3000/api/auth/me                        │
│ - Envía cookie JWT (credentials: 'include')                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PASO 4: Backend valida JWT                                     │
│ - Lee cookie auth_token                                         │
│ - Verifica firma del JWT                                        │
│ - Obtiene userId del JWT                                        │
│ - Busca usuario en base de datos                               │
│ - Devuelve: { success: true, data: { usuario: {...} } }        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PASO 5: getCurrentUser() retorna usuario                       │
│ - usuario = { id: 1, nombre: "Juan", correo: "juan@gmail.com" }│
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PASO 6: UserContext actualiza estados                          │
│ - setUser(usuario) → user = { ... }                            │
│ - setLoading(false) → loading = false                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PASO 7: Componentes se re-renderizan                           │
│ - loading = false → No muestra "Cargando..."                   │
│ - user existe → Muestra contenido de Home                      │
│ - Usuario continúa donde estaba ✅                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparación: Sin vs Con Persistencia

| Aspecto | Sin Persistencia | Con Persistencia |
|---------|-----------------|------------------|
| **Recarga página** | Pierde sesión ❌ | Mantiene sesión ✅ |
| **Usuario debe** | Hacer login de nuevo | Continuar navegando |
| **Experiencia** | Frustrante 😡 | Fluida 😊 |
| **Cookie JWT** | Existe pero no se usa | Se verifica y usa |
| **Estados adicionales** | Solo `user` | `user` + `loading` |
| **Funciones nuevas** | Ninguna | `getCurrentUser()` |

---

## 🎯 Checklist de Persistencia

- [ ] Agregar función `getCurrentUser()` en `src/api/auth.js`
- [ ] Importar `useEffect` en `UserContext.jsx`
- [ ] Importar `getCurrentUser` en `UserContext.jsx`
- [ ] Agregar estado `loading` en `UserContext`
- [ ] Agregar `useEffect` con `checkSession()` en `UserContext`
- [ ] Compartir `loading` en el value del Context
- [ ] (Opcional) Usar `loading` en componentes para mostrar "Cargando..."
- [ ] Probar: Iniciar sesión → Recargar página (F5) → Debe mantener sesión

---

## 🧪 Cómo Probar la Persistencia

1. **Inicia sesión:**
   ```
   - Click en "Iniciar sesión con Google"
   - Autentica en Google
   - Llegas a Home
   - Ves tus datos: nombre, email
   ```

2. **Recarga la página:**
   ```
   - Presiona F5
   - O Ctrl+R (Cmd+R en Mac)
   ```

3. **Resultado esperado:**
   ```
   ✅ Ves "Cargando..." por 1-2 segundos
   ✅ Luego vuelves a Home con tus datos
   ✅ NO te redirige al login
   ```

4. **Sin persistencia (para comparar):**
   ```
   ❌ Al recargar, vuelves al login
   ❌ Tienes que autenticarte de nuevo
   ```

---

## 🐛 Solución de Problemas - Persistencia

| Problema | Causa | Solución |
|----------|-------|----------|
| Se pierde sesión al recargar | No se agregó `getCurrentUser()` | Verificar que la función existe en `auth.js` |
| Error 401 en `/auth/me` | Backend no tiene el endpoint | Crear endpoint `/auth/me` con middleware JWT |
| Cookie no se envía | Falta `credentials: 'include'` | Agregar en la petición de `getCurrentUser()` |
| Loading infinito | `setLoading(false)` no se ejecuta | Verificar que está en bloque `finally` |
| Usuario siempre null | Backend no devuelve estructura correcta | Verificar respuesta: `{ success, data: { usuario } }` |

---

## 💡 Conceptos Clave de Persistencia

### 1. **credentials: 'include'**
```javascript
fetch(url, { credentials: 'include' })
```
- **Qué hace:** Envía cookies en peticiones cross-origin
- **Por qué:** Frontend (5173) y Backend (3000) son diferentes puertos
- **Sin esto:** Cookie JWT no se envía → Backend no reconoce sesión

### 2. **useEffect con []**
```javascript
useEffect(() => { ... }, [])
```
- **Qué hace:** Ejecuta código UNA sola vez al montar
- **Por qué:** Solo queremos verificar sesión al inicio
- **Sin []:** Se ejecutaría en cada render → Loop infinito

### 3. **finally en try-catch**
```javascript
try { ... } catch { ... } finally { setLoading(false) }
```
- **Qué hace:** Se ejecuta SIEMPRE (éxito o error)
- **Por qué:** Necesitamos quitar loading en ambos casos
- **Sin finally:** Si hay error, loading se queda en true para siempre

---

## 🎓 Resumen de Persistencia

**Archivos modificados:**
1. ✅ `src/api/auth.js` - Agregar `getCurrentUser()`
2. ✅ `src/context/UserContext.jsx` - Agregar `useEffect` + `loading`

**Nuevas funcionalidades:**
1. ✅ Verificación automática de sesión al cargar la app
2. ✅ Recuperación del usuario desde cookie JWT
3. ✅ Estado `loading` para mejor UX

**Beneficios:**
1. ✅ Usuario no pierde sesión al recargar
2. ✅ Mejor experiencia (no requiere login repetido)
3. ✅ Aprovecha cookie JWT que ya existe
