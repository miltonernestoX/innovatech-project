import { useState, useEffect } from 'react';
import { getOrdenes } from '../api/ordenes';

// ============================================
// Ordenes.jsx
// - Lista las órdenes del usuario autenticado
// - Maneja loading, error y estado vacío
// ============================================

function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        setErrorMsg('');

        const data = await getOrdenes();

        // ✅ Asegurar array para evitar pantallas “vacías raras”
        setOrdenes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error:', error);
        setErrorMsg(error?.message || 'No se pudieron cargar las órdenes.');
        setOrdenes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdenes();
  }, []);

  // ============================================
  // HELPERS
  // ============================================

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString();
  };

  const formatTotal = (total) => {
    if (total == null) return 'N/A';
    return `$${Number(total).toFixed(2)}`;
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return <div>Cargando ordenes...</div>;
  }

  return (
    <div>
      <h1>Ordenes</h1>

      {errorMsg ? <p style={{ color: 'red' }}>{errorMsg}</p> : null}

      {ordenes.length === 0 ? (
        <p>No hay órdenes para mostrar.</p>
      ) : (
        <table cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {ordenes.map((orden, idx) => (
              <tr key={orden.id_orden ?? orden.id ?? idx}>
                <td>{orden.id_orden ?? orden.id ?? 'N/A'}</td>
                <td>
                  {orden.Usuario?.nombre_completo ||
                    orden.usuario ||
                    orden.email ||
                    'N/A'}
                </td>
                <td>{formatFecha(orden.fecha_orden || orden.created_at || orden.fecha)}</td>
                <td>{formatTotal(orden.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Ordenes;
