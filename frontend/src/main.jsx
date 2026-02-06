import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * StrictMode comentado temporalmente para aprendizaje
 * 
 * ¿Qué hace StrictMode?
 * - Ejecuta useEffect DOS veces en desarrollo
 * - Ayuda a detectar bugs
 * - Causa comportamientos "raros" al aprender
 * 
 * ¿Por qué lo comentamos?
 * - Para evitar la doble ejecución
 * - Simplifica el aprendizaje
 * - En producción NO afecta (solo se activa en desarrollo)
 * 
 * ⚠️ IMPORTANTE:
 * - En proyectos reales, MANTENER StrictMode activado
 * - Solo desactivar para aprendizaje/debugging
 */
createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
)
