import { useState, useEffect } from 'react';
import { getUsuarios } from '../api/usuarios';
import { useUser } from '../context/UserContext';

function Usuarios() {
  const { user, loading: sessionLoading } = useUser();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await getUsuarios();
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Solo intentar cargar si ya sabemos la sesión
    if (!sessionLoading) {
      fetchUsuarios();
    }
  }, [sessionLoading]);

  if (sessionLoading) return <p>Verificando sesión...</p>;

  // Defensa extra (aunque ya estás usando <AdminRoute /> en App.jsx)
  const role = user?.role || 'user';
  if (!user) return <p>No autenticado.</p>;
  if (role !== 'admin') return <p>No tienes permisos para ver esta página.</p>;

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <div>
      <h1>Usuarios</h1>

      {usuarios.length === 0 ? (
        <p>No hay usuarios para mostrar.</p>
      ) : (
        <ul>
          {usuarios.map((u, idx) => (
            <li key={u.id ?? u._id ?? idx}>
              <strong>{u.name ?? u.nombre ?? 'Sin nombre'}</strong>
              {u.email ? ` — ${u.email}` : ''}
              {u.role ? ` (${u.role})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Usuarios;
